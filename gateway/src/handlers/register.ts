import type { IRequest } from 'itty-router'
import { verifyMessage } from 'viem'
import { z } from 'zod'
import type { Env } from '../env.d'
import { PARENT_DOMAIN, LABEL_REGEX } from '../constants'
import { getName, createName } from '../db'

const bodySchema = z.object({
  label: z.string().min(1).max(63).refine((l) => LABEL_REGEX.test(l), 'Label must be alphanumeric or hyphen'),
  address: z.string().refine((s) => /^0x[a-fA-F0-9]{40}$/.test(s)),
  signature: z.string().refine((s) => /^0x[a-fA-F0-9]{130}$/.test(s)),
  message: z.string(),
})

export async function register(request: IRequest, env: Env): Promise<Response> {
  const body = await request.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
  }
  const { label, address, signature, message } = parsed.data

  const expectedMessage = `Claim ${label}.${PARENT_DOMAIN}`
  if (message !== expectedMessage) {
    return Response.json({ success: false, error: 'Message does not match expected claim' }, { status: 400 })
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

  const name = `${label}.${PARENT_DOMAIN}`
  const existing = await getName(env, name)
  if (existing) {
    if (existing.owner.toLowerCase() !== address.toLowerCase()) {
      return Response.json({ success: false, error: 'Name already taken' }, { status: 409 })
    }
    return Response.json({ success: true, name }, { status: 200 })
  }

  await createName(env, name, address, {
    'agent.uniperk.allowed': 'false',
    'agent.uniperk.maxTrade': '1000',
    'agent.uniperk.tokens': 'ETH,USDC,WETH',
    'agent.uniperk.slippage': '50',
  })
  return Response.json({ success: true, name }, { status: 201 })
}
