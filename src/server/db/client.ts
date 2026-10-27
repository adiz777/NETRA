import { createRequire } from 'node:module';

export interface IDatabase {
  prepare(query: string): IPreparedStatement;
  exec(query: string): Promise<void>;
}

export interface IPreparedStatement {
  bind(...values: unknown[]): IPreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean; meta?: unknown }>;
}

// Cloudflare D1 adapter
class CloudflareD1PreparedStatement implements IPreparedStatement {
  private boundStmt: any;

  constructor(stmt: any) {
    this.boundStmt = stmt;
  }

  bind(...values: unknown[]): IPreparedStatement {
    this.boundStmt = this.boundStmt.bind(...values);
    return this;
  }

  async first<T = Record<string, unknown>>(colName?: string): Promise<T | null> {
    const res = await this.boundStmt.first(colName);
    return (res as T) ?? null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    const res = await this.boundStmt.all();
    return { results: (res.results as T[]) || [] };
  }

  async run(): Promise<{ success: boolean; meta?: unknown }> {
    const res = await this.boundStmt.run();
    return { success: res.success ?? true, meta: res.meta };
  }
}

export class CloudflareD1Adapter implements IDatabase {
  constructor(private d1: any) {}

  prepare(query: string): IPreparedStatement {
    return new CloudflareD1PreparedStatement(this.d1.prepare(query));
  }

  async exec(query: string): Promise<void> {
    await this.d1.exec(query);
  }
}

// Better-sqlite3 adapter for testing
class BetterSqlitePreparedStatement implements IPreparedStatement {
  private values: unknown[] = [];

  constructor(private db: any, private query: string) {}

  bind(...values: unknown[]): IPreparedStatement {
    this.values = values;
    return this;
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const stmt = this.db.prepare(this.query);
    const row = stmt.get(...this.values);
    return (row as T) ?? null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    const stmt = this.db.prepare(this.query);
    const rows = stmt.all(...this.values);
    return { results: (rows as T[]) || [] };
  }

  async run(): Promise<{ success: boolean; meta?: unknown }> {
    const stmt = this.db.prepare(this.query);
    const info = stmt.run(...this.values);
    return { success: true, meta: info };
  }
}

export class BetterSqliteAdapter implements IDatabase {
  constructor(private db: any) {}

  prepare(query: string): IPreparedStatement {
    return new BetterSqlitePreparedStatement(this.db, query);
  }

  async exec(query: string): Promise<void> {
    this.db.exec(query);
  }

  getNativeDb(): any {
    return this.db;
  }
}

let globalTestDb: IDatabase | null = null;

export function setGlobalTestDb(db: IDatabase | null): void {
  globalTestDb = db;
}

export function getGlobalTestDb(): IDatabase | null {
  return globalTestDb;
}

export function createInMemoryDb(schemaSql?: string): IDatabase {
  const req = createRequire(import.meta.url);
  const Database = req('better-sqlite3');
  const nativeDb = new Database(':memory:');
  nativeDb.pragma('foreign_keys = ON');

  if (schemaSql) {
    nativeDb.exec(schemaSql);
  }

  return new BetterSqliteAdapter(nativeDb);
}

export function getDb(env?: { DB?: any }): IDatabase {
  if (globalTestDb) {
    return globalTestDb;
  }
  if (env?.DB) {
    return new CloudflareD1Adapter(env.DB);
  }
  throw new Error('No database available: Neither globalTestDb nor env.DB is set');
}
