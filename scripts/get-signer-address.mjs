#!/usr/bin/env node
/**
 * Obtiene la dirección signer (cuenta) a partir de la PRIVATE_KEY del gateway.
 * Usar esta dirección al desplegar el OffchainResolver con ccip-tools
 * (createOffchainResolver(gatewayUrl, [signerAddress])).
 *
 * Uso:
 *   PRIVATE_KEY=0x... node scripts/get-signer-address.mjs
 *   o desde gateway/: node ../scripts/get-signer-address.mjs  (lee .dev.vars si existe)
 */

import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let privateKey = process.env.PRIVATE_KEY

if (!privateKey && existsSync(resolve(__dirname, '../gateway/.dev.vars'))) {
  const content = readFileSync(resolve(__dirname, '../gateway/.dev.vars'), 'utf8')
  const match = content.match(/PRIVATE_KEY=(.+)/)
  if (match) privateKey = match[1].trim()
}

if (!privateKey || !privateKey.startsWith('0x')) {
  console.error('Usage: PRIVATE_KEY=0x... node scripts/get-signer-address.mjs')
  console.error('Or run from gateway/ with .dev.vars containing PRIVATE_KEY=0x...')
  process.exit(1)
}

const account = privateKeyToAccount(privateKey)
console.log('Signer address (use this in ccip-tools / OffchainResolver):')
console.log(account.address)
