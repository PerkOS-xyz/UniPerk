import type { IRequest } from 'itty-router'
import type { Env } from '../env.d'
import { getSubdomainByAddress } from '../db'

export async function getSubdomainByAddressHandler(request: IRequest, env: Env): Promise<Response> {
  const address = request.query?.address as string | undefined
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return Response.json({ error: 'Missing or invalid address' }, { status: 400 })
  }
  const name = await getSubdomainByAddress(env, address)
  return Response.json({ subdomain: name })
}
