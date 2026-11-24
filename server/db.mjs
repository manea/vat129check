import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_DATA_DIR = path.resolve(import.meta.dirname, '..', 'data');

export function normalizeSqlitePath(options = {}) {
  const envDataDir = process.env.VAT129CHECK_DATA_DIR;
  if (options.dbPath === ':memory:') {
    return ':memory:';
  }
  if (options.dbPath) {
    fs.mkdirSync(path.dirname(options.dbPath), { recursive: true });
    return options.dbPath;
  }
  const dataDir = path.resolve(options.dataDir || envDataDir || DEFAULT_DATA_DIR);
  fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, 'vat129check.sqlite');
}

export function withImmediateTransaction(db, work) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = work();
    db.exec('COMMIT');
    return out;
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // Ignore rollback errors if connection closed
    }
    throw err;
  }
}

export function allocateDossierCodeTx(db, year = new Date().getUTCFullYear()) {
  const normalizedYear =
    Number.isInteger(year) && year >= 2024 ? year : new Date().getUTCFullYear();
  const row = db
    .prepare(
      `INSERT INTO dossier_counters (year, last_seq)
       VALUES (?, 1)
       ON CONFLICT(year) DO UPDATE SET last_seq = last_seq + 1
       RETURNING last_seq`,
    )
    .get(normalizedYear);
  const seq = Number(row?.last_seq ?? 1);
  return `VAT-${normalizedYear}-${String(seq).padStart(4, '0')}`;
}

export function generatePublicSlug() {
  return `vat129-${crypto.randomBytes(6).toString('hex')}`;
}

export function createDb(options = {}) {
  const filename = normalizeSqlitePath(options);
  const db = new DatabaseSync(filename);

  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_name TEXT NOT NULL,
      trn_number TEXT NOT NULL DEFAULT '100456789100003',
      assessment_date TEXT NOT NULL DEFAULT '2026-11-25',
      applies_reverse_charge INTEGER NOT NULL DEFAULT 1,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dossier_counters (
      year INTEGER PRIMARY KEY,
      last_seq INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
      dossier_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      organization_name TEXT NOT NULL,
      trn_number TEXT NOT NULL,
      assessment_date TEXT NOT NULL,
      status TEXT NOT NULL,
      readiness_score INTEGER NOT NULL,
      new_regime_total_aed REAL NOT NULL DEFAULT 0,
      legacy_regime_total_aed REAL NOT NULL DEFAULT 0,
      net_savings_vs_legacy_aed REAL NOT NULL DEFAULT 0,
      credit_status TEXT NOT NULL DEFAULT 'none',
      days_remaining_to_cliff INTEGER NOT NULL DEFAULT 0,
      input_json TEXT NOT NULL,
      result_json TEXT NOT NULL,
      canonical_text TEXT NOT NULL DEFAULT '',
      dossier_sha256 TEXT NOT NULL DEFAULT '',
      public_slug TEXT UNIQUE,
      locked_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
    CREATE INDEX IF NOT EXISTS idx_assessments_updated ON assessments(updated_at DESC);

    CREATE TABLE IF NOT EXISTS public_report_views (
      slug_or_code TEXT PRIMARY KEY,
      view_count INTEGER NOT NULL DEFAULT 0,
      last_viewed_at TEXT
    );
  `);

  return db;
}

export function getDbStats(db) {
  const journalRow = db.prepare('PRAGMA journal_mode;').get();
  const profileCount = Number(db.prepare('SELECT COUNT(*) AS cnt FROM profiles').get()?.cnt ?? 0);
  const assessmentCount = Number(
    db.prepare('SELECT COUNT(*) AS cnt FROM assessments').get()?.cnt ?? 0,
  );
  const lockedCount = Number(
    db.prepare('SELECT COUNT(*) AS cnt FROM assessments WHERE locked_at IS NOT NULL').get()?.cnt ?? 0,
  );
  return {
    journalMode: String(journalRow?.journal_mode ?? 'unknown').toLowerCase(),
    profileCount,
    assessmentCount,
    lockedCount,
  };
}

export function closeDb(db) {
  if (db && typeof db.close === 'function') {
    try {
      db.close();
    } catch {
      // Ignore if already closed
    }
  }
}
