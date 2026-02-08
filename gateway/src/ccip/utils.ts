import type { AbiItem, Hex } from 'viem'
import { sign } from 'viem/accounts'
import { serializeSignature } from 'viem'
import {
  bytesToString,
  decodeFunctionData,
  encodeAbiParameters,
  encodeFunctionResult,
  encodePacked,
  keccak256,
  parseAbi,
  toBytes,
} from 'viem/utils'

type ResolverQueryAddr = {
  args: readonly [nodeHash: Hex] | readonly [nodeHash: Hex, coinType: bigint]
  functionName: 'addr'
}
type ResolverQueryText = {
  args: readonly [nodeHash: Hex, key: string]
  functionName: 'text'
}
type ResolverQueryContentHash = {
  args: readonly [nodeHash: Hex]
  functionName: 'contenthash'
}

export type ResolverQuery = ResolverQueryAddr | ResolverQueryText | ResolverQueryContentHash

export interface DecodedRequest {
  name: string
  query: ResolverQuery
}

function bytesToPacket(bytes: Uint8Array): string {
  let offset = 0
  let result = ''
  while (offset < bytes.length) {
    const len = bytes[offset]
    if (len === 0) {
      offset += 1
      break
    }
    result += `${bytesToString(bytes.subarray(offset + 1, offset + len + 1))}.`
    offset += len + 1
  }
  return result.replace(/\.$/, '')
}

function dnsDecodeName(encodedName: string): string {
  return bytesToPacket(toBytes(encodedName as Hex))
}

const OFFCHAIN_RESOLVER_ABI = parseAbi([
  'function resolve(bytes calldata name, bytes calldata data) view returns(bytes memory result, uint64 expires, bytes memory sig)',
])

const RESOLVER_ABI = parseAbi([
  'function addr(bytes32 node) view returns (address)',
  'function addr(bytes32 node, uint256 coinType) view returns (bytes memory)',
  'function text(bytes32 node, string key) view returns (string memory)',
  'function contenthash(bytes32 node) view returns (bytes memory)',
])

export function decodeEnsOffchainRequest(params: {
  sender: Hex
  data: Hex
}): DecodedRequest {
  const { data } = params
  const decodedResolveCall = decodeFunctionData({
    abi: OFFCHAIN_RESOLVER_ABI,
    data,
  })
  const [dnsEncodedName, encodedResolveCall] = decodedResolveCall.args
  const name = dnsDecodeName(dnsEncodedName)
  const query = decodeFunctionData({
    abi: RESOLVER_ABI,
    data: encodedResolveCall,
  }) as ResolverQuery
  return { name, query }
}

export async function encodeEnsOffchainResponse(
  request: { sender: Hex; data: Hex },
  result: string,
  signerPrivateKey: Hex
): Promise<Hex> {
  const { sender, data } = request
  const { query } = decodeEnsOffchainRequest({ sender, data })
  const ttl = 1000
  const validUntil = Math.floor(Date.now() / 1000 + ttl)

  const abiItem = (RESOLVER_ABI as AbiItem[]).find(
    (a: AbiItem) =>
      'name' in a && a.name === query.functionName && (a.inputs?.length ?? 0) === query.args.length
  )
  if (!abiItem) throw new Error(`Unsupported query: ${query.functionName}`)
  const functionResult = encodeFunctionResult({
    abi: [abiItem],
    functionName: query.functionName,
    result,
  })

  const messageHash = keccak256(
    encodePacked(
      ['bytes', 'address', 'uint64', 'bytes32', 'bytes32'],
      [
        '0x1900',
        sender,
        BigInt(validUntil),
        keccak256(data),
        keccak256(functionResult as Hex),
      ]
    )
  )

  const sig = await sign({
    hash: messageHash as Hex,
    privateKey: signerPrivateKey,
  })

  const sigBytes = serializeSignature(sig)

  return encodeAbiParameters(
    [
      { name: 'result', type: 'bytes' },
      { name: 'expires', type: 'uint64' },
      { name: 'sig', type: 'bytes' },
    ],
    [functionResult, BigInt(validUntil), sigBytes]
  ) as Hex
}

export { RESOLVER_ABI }
