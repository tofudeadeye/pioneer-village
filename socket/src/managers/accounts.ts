import { eq, or } from 'drizzle-orm';

import { db } from '../db/connection';
import { type AccountSchemaType, AccountsSchema, type NewAccountSchemaType } from '../db/schema';

class Accounts {
  static readonly instance: Accounts = new Accounts();

  constructor() {
    if (Accounts.instance) {
      throw new Error('Error: Instantiation failed: Use Accounts.Instance instead of new.');
    }
  }

  async getOrCreate(identifiers: Record<string, string>): Promise<AccountSchemaType> {
    const whereConditions = [];

    for (const key in identifiers) {
      if (key === 'ip' || key === 'license' || key === 'license2' || key === 'discord') {
        continue;
      }

      if (key === 'steam' && identifiers[key]) {
        whereConditions.push(eq(AccountsSchema.identifier_steam, identifiers[key]));
      }
      if (key === 'fivem' && identifiers[key]) {
        whereConditions.push(eq(AccountsSchema.identifier_fivem, identifiers[key]));
      }
    }

    if (whereConditions.length === 0) {
      throw new Error('No valid identifiers provided');
    }

    const account = await db
      .select()
      .from(AccountsSchema)
      .where(or(...whereConditions))
      .limit(1);

    if (account.length > 0) {
      return account[0];
    }

    return this.createAccount(identifiers);
  }

  async createAccount(identifiers: Record<string, string>): Promise<AccountSchemaType> {
    const newAccount: NewAccountSchemaType = {
      identifier_steam: identifiers.steam,
      identifier_fivem: identifiers.fivem || null,
      identifier_discord: identifiers.discord || null,
      identifier_ip: identifiers.ip || null,
    };

    const result = await db.insert(AccountsSchema).values(newAccount).returning();
    return result[0];
  }
}

export default Accounts.instance;
