import { eq } from 'drizzle-orm';

import BirdTypes from '../../../lib/shared/bird-types';
import { findNearestPostOffice } from '../../../lib/shared/post-offices';
import { db } from '../db/connection';
import { PigeonDeliveriesSchema, type PigeonDeliverySchemaType } from '../db/schema';
import { logInfoS } from '../helpers';
import { userNamespace } from '../server';
import characters from './characters';
import Characters from './characters';

const TICK_INTERVAL_MS = 5_000;

class Birds {
  private static instance: Birds;
  private tickTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): Birds {
    if (!Birds.instance) {
      Birds.instance = new Birds();
    }
    return Birds.instance;
  }

  async init(): Promise<void> {
    await this.reconcileOnStartup();
    this.startTickLoop();
    logInfoS('[Pigeons]', 'Pigeon delivery system initialized');
  }

  getBirdTypeSpeed(birdType: string): number {
    const config = BirdTypes[birdType];
    if (!config) return BirdTypes.pigeon.speed;
    return config.speed;
  }

  async isBirdAvailable(birdInventoryId: number): Promise<boolean> {
    const existing = await db
      .select()
      .from(PigeonDeliveriesSchema)
      .where(eq(PigeonDeliveriesSchema.pigeonItemId, birdInventoryId));
    return existing.length === 0;
  }

  async sendPigeon(params: {
    pigeonItemId: number;
    birdType: string;
    ownerId: number;
    receiverId: number;
    originX: number;
    originY: number;
    originZ: number;
    destX: number;
    destY: number;
    destZ: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const dx = params.destX - params.originX;
      const dy = params.destY - params.originY;
      const totalDistance = this.calculate2DDistance(params.originX, params.originY, params.destX, params.destY);

      if (totalDistance < 1) {
        return { success: false, error: 'Destination too close' };
      }

      await db.insert(PigeonDeliveriesSchema).values({
        pigeonItemId: params.pigeonItemId,
        birdType: params.birdType,
        state: 'DELIVERING',
        ownerId: params.ownerId,
        receiverId: params.receiverId,
        originX: params.originX.toString(),
        originY: params.originY.toString(),
        originZ: params.originZ.toString(),
        destX: params.destX.toString(),
        destY: params.destY.toString(),
        destZ: params.destZ.toString(),
        totalDistance: totalDistance.toString(),
        distanceCovered: '0',
      });

      logInfoS(
        '[Pigeons]',
        `Pigeon ${params.pigeonItemId} sent from owner ${params.ownerId} to receiver ${params.receiverId}, distance: ${totalDistance.toFixed(1)}`,
      );
      return { success: true };
    } catch (error) {
      logInfoS('[Pigeons]', `Failed to send pigeon: ${error}`);
      return { success: false, error: 'Failed to create delivery' };
    }
  }

  async getActiveDeliveries(characterId: number): Promise<CarrierBirds.ActiveDelivery[]> {
    try {
      const deliveries = await db.select().from(PigeonDeliveriesSchema);

      return deliveries
        .filter((d) => d.ownerId === characterId || d.receiverId === characterId)
        .map((d) => ({
          id: d.id,
          pigeonItemId: d.pigeonItemId,
          birdType: d.birdType,
          state: d.state as string,
          ownerId: d.ownerId,
          receiverId: d.receiverId,
          totalDistance: parseFloat(d.totalDistance),
          distanceCovered: parseFloat(d.distanceCovered || '0'),
          createdAt: d.createdAt.toISOString(),
        }));
    } catch (error) {
      logInfoS('[Pigeons]', `Failed to get active deliveries: ${error}`);
      return [];
    }
  }

  private startTickLoop(): void {
    this.tickTimer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
    logInfoS('[Pigeons]', 'Tick loop started');
  }

  private async tick(): Promise<void> {
    try {
      const deliveries = await db.select().from(PigeonDeliveriesSchema);
      if (deliveries.length === 0) return;

      const now = new Date();

      for (const delivery of deliveries) {
        const elapsedSeconds = (now.getTime() - delivery.lastTickAt.getTime()) / 1000;
        if (elapsedSeconds <= 0) continue;

        const speed = this.getBirdTypeSpeed(delivery.birdType);
        const distanceThisTick = speed * elapsedSeconds;
        const currentDistance = parseFloat(delivery.distanceCovered || '0');
        const total = parseFloat(delivery.totalDistance);
        const newDistance = currentDistance + distanceThisTick;

        if (delivery.state === 'DELIVERING') {
          await this.handleDeliveringState(delivery, newDistance, total, now);
        } else if (delivery.state === 'RETURNING') {
          await this.handleReturningState(delivery, newDistance, total, now);
        }
      }
    } catch (error) {
      logInfoS('[Pigeons]', `Tick error: ${error}`);
    }
  }

  private async handleDeliveringState(
    delivery: PigeonDeliverySchemaType,
    newDistance: number,
    totalDistance: number,
    now: Date,
  ): Promise<void> {
    if (newDistance >= totalDistance) {
      const receiverChar = characters.getActiveCharacterForCharacterId(delivery.receiverId);
      const isOnline = receiverChar && receiverChar.source !== -1 && !receiverChar.offline;

      if (isOnline) {
        await this.deliverToPlayer(delivery, now);
      } else {
        await this.rerouteToPostOffice(delivery, now);
      }
    } else {
      await db
        .update(PigeonDeliveriesSchema)
        .set({
          distanceCovered: newDistance.toString(),
          lastTickAt: now,
        })
        .where(eq(PigeonDeliveriesSchema.id, delivery.id));
    }
  }

  private async deliverToPlayer(delivery: PigeonDeliverySchemaType, now: Date): Promise<void> {
    logInfoS('[Pigeons]', `Pigeon ${delivery.pigeonItemId} arrived at receiver ${delivery.receiverId}`);

    const ownerCoords = await characters.getLastCoords(delivery.ownerId);

    await db
      .update(PigeonDeliveriesSchema)
      .set({
        state: 'RETURNING',
        originX: delivery.destX,
        originY: delivery.destY,
        originZ: delivery.destZ,
        destX: ownerCoords.x.toString(),
        destY: ownerCoords.y.toString(),
        destZ: ownerCoords.z.toString(),
        totalDistance: this.calculate2DDistance(
          parseFloat(delivery.destX),
          parseFloat(delivery.destY),
          ownerCoords.x,
          ownerCoords.y,
        ).toString(),
        distanceCovered: '0',
        lastTickAt: now,
        stateChangedAt: now,
      })
      .where(eq(PigeonDeliveriesSchema.id, delivery.id));
  }

  private async rerouteToPostOffice(delivery: PigeonDeliverySchemaType, now: Date): Promise<void> {
    const nearestPO = findNearestPostOffice(parseFloat(delivery.destX), parseFloat(delivery.destY));
    logInfoS('[Pigeons]', `Receiver ${delivery.receiverId} offline, rerouting to ${nearestPO.label} post office`);

    const ownerCoords = await characters.getLastCoords(delivery.ownerId);

    const returnDistance = this.calculate2DDistance(
      nearestPO.coords.x,
      nearestPO.coords.y,
      ownerCoords.x,
      ownerCoords.y,
    );

    await db
      .update(PigeonDeliveriesSchema)
      .set({
        state: 'RETURNING',
        originX: nearestPO.coords.x.toString(),
        originY: nearestPO.coords.y.toString(),
        originZ: nearestPO.coords.z.toString(),
        destX: ownerCoords.x.toString(),
        destY: ownerCoords.y.toString(),
        destZ: ownerCoords.z.toString(),
        totalDistance: returnDistance.toString(),
        distanceCovered: '0',
        lastTickAt: now,
        stateChangedAt: now,
      })
      .where(eq(PigeonDeliveriesSchema.id, delivery.id));
  }

  private async handleReturningState(
    delivery: PigeonDeliverySchemaType,
    newDistance: number,
    totalDistance: number,
    now: Date,
  ): Promise<void> {
    if (newDistance >= totalDistance) {
      logInfoS('[Pigeons]', `Pigeon ${delivery.pigeonItemId} returned to owner ${delivery.ownerId}`);

      await db.delete(PigeonDeliveriesSchema).where(eq(PigeonDeliveriesSchema.id, delivery.id));

      const birdEvent: CarrierBirds.BirdEvent = {
        type: 'return',
        characterId: delivery.ownerId,
        birdType: delivery.birdType as CarrierBirds.BirdTypes,
        birdInventoryId: delivery.pigeonItemId,
      };
      userNamespace.emit('__client__', 'carrier-birds.event', birdEvent);
      userNamespace.emit('carrier-birds.event', birdEvent);
    } else {
      await db
        .update(PigeonDeliveriesSchema)
        .set({
          distanceCovered: newDistance.toString(),
          lastTickAt: now,
        })
        .where(eq(PigeonDeliveriesSchema.id, delivery.id));
    }
  }

  private async reconcileOnStartup(): Promise<void> {
    try {
      const deliveries = await db.select().from(PigeonDeliveriesSchema);

      if (deliveries.length === 0) {
        logInfoS('[Pigeons]', 'No orphaned deliveries to reconcile');
        return;
      }

      logInfoS('[Pigeons]', `Reconciling ${deliveries.length} orphaned deliveries`);

      for (const delivery of deliveries) {
        if (delivery.state === 'DELIVERING' || delivery.state === 'WAITING_REPLY') {
          const nearestPO = findNearestPostOffice(parseFloat(delivery.destX), parseFloat(delivery.destY));
          logInfoS(
            '[Pigeons]',
            `Orphaned delivery ${delivery.id}: letter routed to ${nearestPO.label} post office for receiver ${delivery.receiverId}`,
          );
        }
      }

      await db.delete(PigeonDeliveriesSchema);
      logInfoS('[Pigeons]', 'Runtime table wiped after reconciliation');
    } catch (error) {
      logInfoS('[Pigeons]', `Reconciliation failed: ${error}`);
    }
  }

  private calculate2DDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.max(Math.sqrt(dx * dx + dy * dy), 200);
  }
}

export default Birds.getInstance();
