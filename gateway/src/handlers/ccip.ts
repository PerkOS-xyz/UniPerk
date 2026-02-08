import type { IRequest } from 'itty-router'
import { isAddress, isHex } from 'viem/utils'
import { z } from 'zod'
import type { Env } from '../env.d'
import { getRecord } from '../ccip/query'
import {
  decodeEnsOffchainRequest,
  encodeEnsOffchainResponse,
} from '../ccip/utils'

const paramsSchema = z.object({
  sender: z.string().refine((s) => isAddress(s)),
  data: z.string().refine((s) => isHex(s)),
})

export async function getCcipRead(request: IRequest, env: Env): Promise<Response> {
  const safeParse = paramsSchema.safeParse(request.params)
  if (!safeParse.success) {
    return Response.json({ error: safeParse.error.flatten() }, { status: 400 })
  }
  const { sender, data } = safeParse.data

  let result: string
  try {
    const { name, query } = decodeEnsOffchainRequest({ sender: sender as `0x${string}`, data: data as `0x${string}` })
    result = await getRecord(name, query, env)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to resolve'
    return Response.json({ message }, { status: 400 })
  }

  const encodedResponse = await encodeEnsOffchainResponse(
    { sender: sender as `0x${string}`, data: data as `0x${string}` },
    result,
    env.PRIVATE_KEY as `0x${string}`
  )
  return Response.json({ data: encodedResponse }, { status: 200 })
}
