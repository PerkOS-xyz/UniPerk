import type { IRequest } from 'itty-router'
import { verifyMessage } from 'viem'
import { z } from 'zod'
import type { Env } from '../env.d'
import { PARENT_DOMAIN } from '../constants'
import { getName, updateTexts } from '../db'

const updateBodySchema = z.object({
  name: z.string().refine((n) => n.endsWith(`.${PARENT_DOMAIN}`)),
  address: z.string().refine((s) => /^0x[a-fA-F0-9]{40}$/.test(s)),
  signature: z.string(),
  message: z.string(),
  permissions: z.object({
    allowed: z.boolean().optional(),
    maxTrade: z.string().optional(),
    tokens: z.string().optional(),
    slippage: z.string().optional(),
    expires: z.string().optional(),
  }),
})

export async function updatePermissions(request: IRequest, env: Env): Promise<Response> {
  if (request.method !== 'PATCH' && request.method !== 'PUT') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }
  const body = await request.json().catch(() => ({}))
  const parsed = updateBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
  }
  const { name, address, signature, message, permissions } = parsed.data

  const expectedMessage = `Update permissions for ${name}`
  if (message !== expectedMessage) {
    return Response.json({ success: false, error: 'Invalid message' }, { status: 400 })
  }

  try {
    const valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })
    if (!valid) {
      return Response.json({ success: false, error: 'Invalid signature' }, { status: 401 })
    }
  } catch {
    return Response.json({ success: false, error: 'Invalid signature' }, { status: 401 })
  }

  const texts: Record<string, string> = {}
  if (permissions.allowed !== undefined) texts['agent.uniperk.allowed'] = permissions.allowed ? 'true' : 'false'
  if (permissions.maxTrade !== undefined) texts['agent.uniperk.maxTrade'] = permissions.maxTrade
  if (permissions.tokens !== undefined) texts['agent.uniperk.tokens'] = permissions.tokens
  if (permissions.slippage !== undefined) texts['agent.uniperk.slippage'] = permissions.slippage
  if (permissions.expires !== undefined) texts['agent.uniperk.expires'] = permissions.expires

  if (Object.keys(texts).length === 0) {
    return Response.json({ success: false, error: 'No permissions to update' }, { status: 400 })
  }

  const ok = await updateTexts(env, name, address, texts)
  if (!ok) {
    return Response.json({ success: false, error: 'Not owner or name not found' }, { status: 403 })
  }
  return Response.json({ success: true })
}
