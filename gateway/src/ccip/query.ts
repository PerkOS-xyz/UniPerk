import { zeroAddress } from 'viem'
import type { Env } from '../env.d'
import type { ResolverQuery } from './utils'
import { getName } from '../db'
import { PARENT_DOMAIN } from '../constants'

export async function getRecord(
  name: string,
  query: ResolverQuery,
  env: Env
): Promise<string> {
  if (!name.endsWith(`.${PARENT_DOMAIN}`)) {
    throw new Error('Name must be a subdomain of ' + PARENT_DOMAIN)
  }
  const nameData = await getName(env, name)

  const { functionName, args } = query
  switch (functionName) {
    case 'addr': {
      const coinType = args[1] ?? BigInt(60)
      const addr = nameData?.addresses?.[coinType.toString()] ?? nameData?.owner ?? zeroAddress
      return addr
    }
    case 'text': {
      const key = args[1]
      return nameData?.texts?.[key] ?? ''
    }
    case 'contenthash': {
      return (nameData?.contenthash as string) ?? '0x'
    }
    default: {
      throw new Error(`Unsupported query function ${functionName}`)
    }
  }
}
