import { NextRequest, NextResponse } from 'next/server'

const MAINNET_RPC = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.llamarpc.com'

/**
 * Proxy mainnet JSON-RPC so the browser hits same-origin (no CORS).
 * Public RPCs often block CORS from localhost.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(MAINNET_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32603, message: String(e) }, id: null },
      { status: 500 }
    )
  }
}
