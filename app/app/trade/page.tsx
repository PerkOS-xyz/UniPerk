'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import Link from 'next/link';
import { useYellow } from '@/hooks/useYellow';
import { WalletConnect } from '@/components/wallet-connect';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TradePage() {
  const { address, isConnected: walletConnected } = useAccount();
  const {
    isConnected: yellowConnected,
    connect,
    sessionId,
    createSession,
    closeSession,
    executeTrade,
    tradeHistory,
    isLoading,
    error
  } = useYellow();

  const [amount, setAmount] = useState('');
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('WETH');

  const handleCreateSession = async () => {
    const agentAddress = '0x742d35Cc6634C0532925a3b844Bc454e4e3447Fe';
    const depositAmount = parseUnits('100', 6);
    await createSession(agentAddress as `0x${string}`, depositAmount);
  };

  const handleTrade = async () => {
    if (!amount) return;
    const tradeAmount = parseUnits(amount, 6);
    await executeTrade(fromToken, toToken, tradeAmount);
    setAmount('');
  };

  const handleSettle = async () => {
    await closeSession();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center p-4 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🦄</span>
            <span className="font-bold text-xl">UniPerk</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Dashboard</Button>
            </Link>
            <ThemeToggle />
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🟡</span>
          <h1 className="text-3xl font-bold">Yellow Network Trading</h1>
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Execute instant, gasless trades via Yellow Network state channels. 
          Settlement happens on Uniswap V4 with tier discounts.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>Connect your wallet and Yellow Network</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${walletConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Wallet: {walletConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Not connected'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${yellowConnected ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <span>Yellow Network: {yellowConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            {!walletConnected && <WalletConnect />}
            {walletConnected && !yellowConnected && (
              <Button onClick={connect} disabled={isLoading} className="w-full">
                {isLoading ? 'Connecting...' : 'Connect to Yellow Network'}
              </Button>
            )}
          </CardContent>
        </Card>

        {yellowConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Trading Session</CardTitle>
              <CardDescription>Create a session to start trading off-chain</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionId ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <span>✅</span>
                    <span className="font-medium">Session Active</span>
                  </div>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block break-all">
                    {sessionId}
                  </code>
                  <Button 
                    onClick={handleSettle} 
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {isLoading ? 'Settling...' : 'Close & Settle to V4'}
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleCreateSession} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Creating...' : 'Create Trading Session (100 USDC)'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {sessionId && (
          <Card>
            <CardHeader>
              <CardTitle>Instant Trade</CardTitle>
              <CardDescription>Off-chain execution, $0 gas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">From</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1"
                    />
                    <select
                      value={fromToken}
                      onChange={(e) => setFromToken(e.target.value)}
                      className="border rounded px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    >
                      <option>USDC</option>
                      <option>WETH</option>
                    </select>
                  </div>
                </div>
                <div className="pb-2 text-xl">→</div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">To</label>
                  <select
                    value={toToken}
                    onChange={(e) => setToToken(e.target.value)}
                    className="border rounded px-3 py-2 w-full bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  >
                    <option>WETH</option>
                    <option>USDC</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>⚡ Execution</span>
                  <span className="font-medium">Instant (off-chain)</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>⛽ Gas Cost</span>
                  <span className="font-medium text-green-600">$0.00</span>
                </div>
              </div>
              
              <Button
                onClick={handleTrade}
                disabled={isLoading || !amount}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {isLoading ? 'Executing...' : 'Execute Instant Trade'}
              </Button>
            </CardContent>
          </Card>
        )}

        {tradeHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>Off-chain trades in this session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tradeHistory.map((trade, i) => (
                  <div key={i} className="flex justify-between text-sm border-b dark:border-gray-700 pb-2 last:border-0">
                    <div>
                      <span className="font-medium">{formatUnits(trade.executedAmount, 6)} USDC</span>
                      <span className="text-gray-400 mx-2">→</span>
                      <span>WETH</span>
                    </div>
                    <div className="text-right">
                      <span className="text-green-600 font-medium">Gas: $0.00</span>
                      <div className="text-xs text-gray-400">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        <Card className="bg-gray-50 dark:bg-gray-900">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">How it works</h3>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>Create a trading session (deposits USDC to Yellow)</li>
              <li>Execute multiple trades instantly (off-chain, $0 gas)</li>
              <li>Close session to settle final balance on Uniswap V4</li>
              <li>UniPerkHook applies your tier discount automatically</li>
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
