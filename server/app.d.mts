import type { Server } from 'node:http';
import type { DatabaseSync } from 'node:sqlite';

export interface Vat129DbOptions {
  dbPath?: string;
  dataDir?: string;
}

export interface Vat129ServerOptions {
  dbPath?: string;
  dataDir?: string;
  basePath?: string;
  staticDir?: string;
  maxBodyBytes?: number;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
  host?: string;
  port?: number;
}

export interface Vat129ServerInstance {
  server: Server;
  db: DatabaseSync;
  basePath: string;
  listen: (port?: number, host?: string) => Promise<{ port: number; host: string; url: string }>;
  close: () => Promise<void>;
}

export function createDb(options?: Vat129DbOptions): DatabaseSync;
export function closeDb(db: DatabaseSync): void;
export function createApp(options?: Vat129ServerOptions): Vat129ServerInstance;
