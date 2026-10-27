import type { IDatabase } from './client.js';
import type { User, UserRole, UserStatus } from '@shared/types/auth.js';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UsersRepository {
  constructor(private db: IDatabase) {}

  async createUser(input: {
    id?: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role?: UserRole;
    status?: UserStatus;
  }): Promise<User> {
    const id = input.id ?? `usr_${crypto.randomUUID().replace(/-/g, '')}`;
    const role = input.role ?? 'investigator';
    const status = input.status ?? 'active';
    const email = input.email.trim().toLowerCase();

    const stmt = this.db.prepare(
      `INSERT INTO users (id, email, password_hash, full_name, role, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    await stmt.bind(id, email, input.passwordHash, input.fullName, role, status).run();

    const user = await this.findById(id);
    if (!user) {
      throw new Error(`Failed to retrieve newly created user with id ${id}`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const stmt = this.db.prepare(
      `SELECT id, email, password_hash, full_name, role, status, created_at, updated_at
       FROM users WHERE email = ? COLLATE NOCASE LIMIT 1`
    );
    const row = await stmt.bind(normalized).first<UserRow>();
    return row ? mapRowToUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const stmt = this.db.prepare(
      `SELECT id, email, password_hash, full_name, role, status, created_at, updated_at
       FROM users WHERE id = ? LIMIT 1`
    );
    const row = await stmt.bind(id).first<UserRow>();
    return row ? mapRowToUser(row) : null;
  }

  async listUsers(): Promise<User[]> {
    const stmt = this.db.prepare(
      `SELECT id, email, password_hash, full_name, role, status, created_at, updated_at
       FROM users ORDER BY created_at DESC`
    );
    const { results } = await stmt.all<UserRow>();
    return results.map(mapRowToUser);
  }

  async updateUser(
    id: string,
    updates: Partial<{ fullName: string; role: UserRole; status: UserStatus }>
  ): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const fullName = updates.fullName ?? existing.fullName;
    const role = updates.role ?? existing.role;
    const status = updates.status ?? existing.status;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(
      `UPDATE users
       SET full_name = ?, role = ?, status = ?, updated_at = ?
       WHERE id = ?`
    );
    await stmt.bind(fullName, role, status, now, id).run();
    return this.findById(id);
  }
}
