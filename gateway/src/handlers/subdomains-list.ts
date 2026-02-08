import type { IRequest } from 'itty-router'
import type { Env } from '../env.d'
import { listNames } from '../db'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

/**
 * GET /subdomains?limit=50&offset=0
 * Lista pública de subdominios registrados (name + owner). Sin auth.
 */
export async function listSubdomainsHandler(request: IRequest, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  )
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0)

  const names = await listNames(env, limit, offset)
  return Response.json({ names, limit, offset })
}
