'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { yellowClient } from '@/lib/yellow/client';
import { sessionManager } from '@/lib/yellow/session';
import { tradingEngine } from '@/lib/yellow/trading';
import type { TradeResult } from '@/lib/yellow/types';

export interface UseYellowReturn {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sessionId: string | null;
  createSession: (agentAddress: `0x${string}`, amount: bigint) => Promise<string>;
  closeSession: () => Promise<void>;
  executeTrade: (fromToken: string, toToken: string, amount: bigint) => Promise<TradeResult>;
  tradeHistory: TradeResult[];
  isLoading: boolean;
  error: string | null;
}

export function useYellow(): UseYellowReturn {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (signMessageAsync) {
      const signer = async (msg: string) => {
        return signMessageAsync({ message: msg });
      };
      sessionManager.setMessageSigner(signer);
      tradingEngine.setMessageSigner(signer);
    }
  }, [signMessageAsync]);

  useEffect(() => {
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    
    yellowClient.on('connected', handleConnected);
    yellowClient.on('disconnected', handleDisconnected);
    
    return () => {
      yellowClient.off('connected', handleConnected);
      yellowClient.off('disconnected', handleDisconnected);
    };
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await yellowClient.connect();
    } catch (e) {
      setError(`Connection failed: ${e}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    yellowClient.disconnect();
    setSessionId(null);
  }, []);

  const createSession = useCallback(async (agentAddress: `0x${string}`, amount: bigint) => {
    if (!address) throw new Error('Wallet not connected');
    setIsLoading(true);
    setError(null);
    try {
      const id = await sessionManager.createSession(address, agentAddress, amount);
      setSessionId(id);
      return id;
    } catch (e) {
      setError(`Failed to create session: ${e}`);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const closeSession = useCallback(async () => {
    if (!sessionId) throw new Error('No active session');
    setIsLoading(true);
    setError(null);
    try {
      await sessionManager.closeSession(sessionId);
      setSessionId(null);
    } catch (e) {
      setError(`Failed to close session: ${e}`);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const executeTrade = useCallback(async (
    fromToken: string,
    toToken: string,
    amount: bigint
  ): Promise<TradeResult> => {
    if (!address || !sessionId) throw new Error('Not ready');
    setIsLoading(true);
    setError(null);
    try {
      const result = await tradingEngine.executeTrade({
        sessionId,
        fromToken: fromToken.toLowerCase() as 'usdc' | 'weth',
        toToken: toToken.toLowerCase() as 'usdc' | 'weth',
        amount,
        userAddress: address
      });
      setTradeHistory(prev => [...prev, result]);
      return result;
    } catch (e) {
      setError(`Trade failed: ${e}`);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [address, sessionId]);

  return {
    isConnected,
    connect,
    disconnect,
    sessionId,
    createSession,
    closeSession,
    executeTrade,
    tradeHistory,
    isLoading,
    error
  };
}
