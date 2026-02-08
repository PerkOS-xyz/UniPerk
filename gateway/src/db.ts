import { neon } from '@neondatabase/serverless'
import type { Env } from './env.d'

export interface NameRecord {
  name: string
  owner: string
  texts: Record<string, string>
  addresses: Record<string, string>
  contenthash?: string
  createdAt: Date
  updatedAt: Date
}

function getSql(env: Env) {
  return neon(env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } })
}

export async function getName(env: Env, name: string): Promise<NameRecord | null> {
  const sql = getSql(env)
  const row = await sql`
    SELECT name, owner, texts, addresses, contenthash, created_at as "createdAt", updated_at as "updatedAt"
    FROM names WHERE name = ${name}
    LIMIT 1
  `.then((rows) => (Array.isArray(rows) ? rows[0] : rows))
  if (!row) return null
  return {
    name: row.name,
    owner: row.owner,
    texts: (row.texts as Record<string, string>) ?? {},
    addresses: (row.addresses as Record<string, string>) ?? {},
    contenthash: row.contenthash ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function getSubdomainByAddress(env: Env, address: string): Promise<string | null> {
  const sql = getSql(env)
  const normalized = address.toLowerCase()
  const row = await sql`
    SELECT name FROM names WHERE LOWER(owner) = ${normalized} LIMIT 1
  `.then((rows) => (Array.isArray(rows) ? rows[0] : rows))
  return row?.name ?? null
}

export async function createName(
  env: Env,
  name: string,
  owner: string,
  initialTexts: Record<string, string> = {}
): Promise<void> {
  const sql = getSql(env)
  const now = new Date().toISOString()
  const addresses = JSON.stringify({ '60': owner })
  await sql`
    INSERT INTO names (name, owner, texts, addresses, created_at, updated_at)
    VALUES (${name}, ${owner}, ${JSON.stringify(initialTexts)}, ${addresses}, ${now}, ${now})
    ON CONFLICT (name) DO NOTHING
  `
}

export async function updateTexts(
  env: Env,
  name: string,
  owner: string,
  texts: Record<string, string>
): Promise<boolean> {
  const sql = getSql(env)
  const existing = await getName(env, name)
  if (!existing || existing.owner.toLowerCase() !== owner.toLowerCase()) return false
  const merged = { ...existing.texts, ...texts }
  const now = new Date().toISOString()
  await sql`
    UPDATE names SET texts = ${JSON.stringify(merged)}, updated_at = ${now}
    WHERE name = ${name} AND LOWER(owner) = ${owner.toLowerCase()}
  `
  return true
}
