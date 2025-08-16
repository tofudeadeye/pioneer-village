import type { Socket } from 'socket.io';
import type { SocketReservedEventsMap } from 'socket.io/dist/socket-types';
import type { DefaultEventsMap, ReservedOrUserEventNames } from 'socket.io/dist/typed-events';

import { logInfoC, logInfoS } from '../helpers';
import Characters from '../managers/characters';
import Inventories from '../managers/inventories';
import { serverNamespace, userNamespace } from '../server';

Inventories.init();

export default () => {
  // inventoryTest(prisma);

  type SocketType = Socket<
    SocketIn.FromClient & SocketOut.ToClient,
    SocketOut.ToClient,
    DefaultEventsMap,
    SocketInternal.Data
  >;

  const sendMoveOrFailData = (
    socket: Socket<SocketIn.FromClient & SocketOut.ToClient, SocketOut.ToClient, DefaultEventsMap, any>,
    requestId: number,
    requestType: UI.Inventory.RequestType,
    event?: UI.Inventory.MoveOrFailData | null,
  ) => {
    if (!event) {
      return;
    }
    if ('requestId' in event) {
      // TODO: Verify this only sends to the original user. Not to the entire room.
      socket.emit('inventory.fail', event);
      logInfoC(`inventory:${event.identifier}`, 'inventory.fail', event);
    } else {
      socket.emit('inventory.success', { identifier: event.identifier, requestId, requestType });
      userNamespace.to(`inventory:${event.identifier}`).emit('inventory.item-move', event);
    }
  };

  class ClientspaceInventory {
    socket: SocketType;

    events: ReservedOrUserEventNames<SocketReservedEventsMap, SocketIn.FromClient & SocketOut.ToClient>[] = [
      'inventory.subscribe',
      'inventory.subscribe-world',
      'inventory.unsubscribe',
      'inventory.item-stack',
      'inventory.item-move',
      'inventory.item-wear',
      'inventory.item-drop',
      'inventory.lost-hat',
      'inventory.check-world',
      'inventory.get-world-inventories',
    ];

    constructor(socket: SocketType) {
      this.socket = socket;
    }

    ['inventory.subscribe']: SocketIn.FromClient['inventory.subscribe'] = async (identifier) => {
      logInfoC('Subscribing to inventory', identifier);

      // TODO: Check if user can access inventory. ie. Is Own Pockets, Distance, etc.
      this.socket.join(`inventory:${identifier}`);

      const inventory = await Inventories.getInventoryForUI(identifier);

      if (!inventory) {
        return;
      }
      // logInfo(`inventory:${identifier}`, yellow('inventory.load'), inventory);

      userNamespace.to(`inventory:${identifier}`).emit('inventory.load', inventory);
    };

    ['inventory.subscribe-world']: SocketIn.FromClient['inventory.subscribe-world'] = async () => {
      // TODO: Get player coords rounded and emit to client that it exists and has items.
    };

    ['inventory.unsubscribe']: SocketIn.FromClient['inventory.unsubscribe'] = (identifier) => {
      logInfoC('Unsubscribing to inventory', identifier);
      this.socket.leave(`inventory:${identifier}`);
    };

    ['inventory.item-stack']: SocketIn.FromClient['inventory.item-stack'] = async (
      requestId,
      oldIdentifier,
      oldSlot,
      newIdentifier,
      newSlot,
    ) => {
      logInfoC('inventory.item-stack', oldIdentifier, oldSlot, newIdentifier, newSlot);

      if (!this.socket.data.character?.id) {
        return;
      }

      const itemStackEvents = await Inventories.stackItem(
        this.socket.data.character?.id,
        requestId,
        oldIdentifier,
        oldSlot,
        newIdentifier,
        newSlot,
      );

      if (itemStackEvents) {
        const [eventOld, eventNew] = itemStackEvents;
        sendMoveOrFailData(this.socket, requestId, 'stack', eventOld);
        sendMoveOrFailData(this.socket, requestId, 'stack', eventNew);
      }
    };

    ['inventory.item-move']: SocketIn.FromClient['inventory.item-move'] = async (
      requestId,
      oldIdentifier,
      oldSlot,
      newIdentifier,
      newSlot,
    ) => {
      logInfoC('inventory.item-move', requestId, oldIdentifier, oldSlot, newIdentifier, newSlot);
      if (!this.socket.data.character?.id) {
        return;
      }

      const [eventSource, eventDestination] = await Inventories.moveItem(
        this.socket.data.character.id,
        requestId,
        oldIdentifier,
        oldSlot,
        newIdentifier,
        newSlot,
      );

      sendMoveOrFailData(this.socket, requestId, 'move', eventSource);
      sendMoveOrFailData(this.socket, requestId, 'move', eventDestination);
    };

    ['inventory.item-wear']: SocketIn.FromClient['inventory.item-wear'] = async (itemId) => {
      logInfoC('inventory.item-wear', itemId);
      const wearAmount = -1;
      const { success, inventoryIdentifier } = await Inventories.changeDurability(itemId, wearAmount);
      logInfoC('success', success, itemId, inventoryIdentifier);

      if (success && inventoryIdentifier) {
        userNamespace.to(`inventory:${inventoryIdentifier}`).emit('inventory.item-wear', itemId, wearAmount);
      }
    };

    ['inventory.lost-hat']: SocketIn.FromClient['inventory.lost-hat'] = async (hatNetId, coords) => {
      // crun KnockOffPedProp(PlayerPedId(), false, true, false, true)
      const [x, y, z] = coords;
      logInfoC('inventory.lost-hat', `Player lost their hat at coordinates: ${x}, ${y}, ${z}`);
      if (!this.socket.data.character?.id) {
        return;
      }

      const characterId = this.socket.data.character.id;
      const identifier = `clothing:${characterId}`;

      const inventory = await Inventories.getInventory(identifier);

      if (!Array.isArray(inventory?.container.items)) {
        return;
      }

      for (const item of inventory.container.items) {
        // @ts-ignore
        if (item?.metadata?.category === 'HATS') {
          console.log(item);
          await Inventories.moveItemToWorld(this.socket.data.character.id, 0, identifier, item.slot || 0, { x, y, z });
          serverNamespace.emit('inventory.set-hat-item-id', hatNetId, item.id);
        }
      }
    };

    ['inventory.item-drop']: SocketIn.FromClient['inventory.item-drop'] = async (requestId, identifier, slot) => {
      logInfoC('inventory.item-drop', requestId, identifier, slot);
      if (!this.socket.data.character?.id) {
        return;
      }

      const serverId = this.socket.data.user.serverId;
      const characterId = this.socket.data.character.id;

      logInfoC('this.socket.data', serverId, characterId);

      const coords = await Characters.getLastCoords(characterId, 250);

      if (coords.x === 0 && coords.y === 0 && coords.z === 0) {
        logInfoC('inventory.item-drop', 'No valid coordinates found for item drop');
        return;
      }

      logInfoC('inventory.item-drop', `Player dropped item at coordinates: ${coords.x}, ${coords.y}, ${coords.z}`);

      const [moveEvent] = await Inventories.moveItemToWorld(characterId, requestId, identifier, slot, coords);

      console.log('moveEvent', moveEvent);

      sendMoveOrFailData(this.socket, requestId, 'stack', moveEvent);
    };

    ['inventory.check-world']: SocketIn.FromClient['inventory.check-world'] = async () => {
      logInfoC('inventory.check-world', 'Checking world inventories');
      if (!this.socket.data.character?.id) {
        return;
      }

      const characterId = this.socket.data.character.id;
      const coords = await Characters.getLastCoords(characterId, 250);

      if (coords.x === 0 && coords.y === 0 && coords.z === 0) {
        return;
      }

      logInfoC(
        'inventory.check-world',
        `Player checking world inventories at coordinates: ${coords.x}, ${coords.y}, ${coords.z}`,
      );

      const inventory = await Inventories.getWorldInventoryAtCoordsContainingItems(coords);

      if (!inventory?.container.items.length) {
        return;
      }

      const identifier = inventory.identifier;

      logInfoC('inventory.check-world', 'Found world inventory', identifier, inventory?.container.items.length);
      this.socket.join(`inventory:${identifier}`);
      this.socket.emit('inventory.open-world', identifier);

      const uiInventory = Inventories.convertToUIInventory(inventory);
      userNamespace.to(`inventory:${identifier}`).emit('inventory.load', uiInventory);
    };

    ['inventory.get-world-inventories']: SocketIn.FromClient['inventory.get-world-inventories'] = async () => {
      logInfoC('inventory.get-world-inventories', 'Requesting world inventories');
      await Inventories.sendWorldInventories(this.socket);
    };
  }

  serverNamespace.on('connection', (socket) => {
    logInfoS('[Inventory]', 'Game server connected');

    socket.on('createInventory', (identifier, inventoryType, cb) => {
      logInfoS('[Inventory]', 'createInventory', identifier, inventoryType);
      try {
        Inventories.createInventory(identifier);
        cb(true);
      } catch (e) {
        cb(false);
      }
    });

    socket.on('inventoryAddItem', async (inventoryId, itemIdentifier, amount = 1, metadata = {}, cb = () => {}) => {
      try {
        const itemAddEvent = await Inventories.addItem(inventoryId, itemIdentifier, amount, metadata);
        if (itemAddEvent) {
          userNamespace.to(`inventory:${itemAddEvent.identifier}`).emit('inventory.item-add', itemAddEvent);
        }
        if (itemAddEvent) {
          cb(true);
        } else {
          cb(false);
        }
      } catch (e) {
        cb(false);
      }
    });

    socket.on('inventory.item-wear', async (itemId: number) => {
      const success = await Inventories.changeDurability(itemId);
    });

    socket.on('inventory.pickup-hat', async (source, itemId) => {
      logInfoC('inventory.pickup-hat', 'Player picked up a hat', source, itemId);
    });
  });

  userNamespace.on('connection', (socket) => {
    logInfoC('[Inventory]', 'User connected', socket.id, socket.data);

    const usI = new ClientspaceInventory(socket);

    for (const event of usI.events) {
      // @ts-ignore
      socket.on(event, usI[event]);
    }
  });
};
