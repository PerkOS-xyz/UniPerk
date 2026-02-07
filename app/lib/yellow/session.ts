import { yellowClient } from './client';
import type { Address } from 'viem';
import type { TradingSession, Allocation, MessageSigner } from './types';

export class SessionManager {
  private sessions: Map<string, TradingSession> = new Map();
  private messageSigner: MessageSigner | null = null;

  setMessageSigner(signer: MessageSigner) {
    this.messageSigner = signer;
  }

  async createSession(
    userAddress: Address,
    agentAddress: Address,
    usdcAmount: bigint
  ): Promise<string> {
    if (!this.messageSigner) {
      throw new Error('Message signer not set');
    }

    const appDefinition = {
      protocol: 'uniperk-trading-v1',
      participants: [userAddress, agentAddress],
      weights: [100, 0],
      quorum: 100,
      challenge: 86400,
      nonce: Date.now()
    };

    const allocations = [
      { 
        participant: userAddress, 
        asset: 'usdc' as const, 
        amount: usdcAmount.toString() 
      }
    ];

    const sessionData = {
      type: 'create_session',
      definition: appDefinition,
      allocations
    };

    const signature = await this.messageSigner(JSON.stringify(sessionData));
    
    yellowClient.send({
      ...sessionData,
      signature,
      sender: userAddress
    });

    return new Promise((resolve) => {
      yellowClient.once('session:created', (msg: unknown) => {
        const message = msg as { sessionId: string };
        const session: TradingSession = {
          id: message.sessionId,
          userAddress,
          agentAddress,
          allocations: allocations.map(a => ({
            participant: a.participant as Address,
            asset: a.asset,
            amount: BigInt(a.amount)
          })),
          status: 'active',
          createdAt: Date.now()
        };
        this.sessions.set(session.id, session);
        resolve(session.id);
      });
      
      setTimeout(() => {
        const mockId = `session_${Date.now()}`;
        const session: TradingSession = {
          id: mockId,
          userAddress,
          agentAddress,
          allocations: allocations.map(a => ({
            participant: a.participant as Address,
            asset: a.asset,
            amount: BigInt(a.amount)
          })),
          status: 'active',
          createdAt: Date.now()
        };
        this.sessions.set(mockId, session);
        resolve(mockId);
      }, 5000);
    });
  }

  getSession(id: string): TradingSession | undefined {
    return this.sessions.get(id);
  }

  getAllSessions(): TradingSession[] {
    return Array.from(this.sessions.values());
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    session.status = 'closing';
    
    yellowClient.send({
      type: 'close_session',
      sessionId,
      finalAllocations: session.allocations.map(a => ({
        ...a,
        amount: a.amount.toString()
      }))
    });

    return new Promise((resolve) => {
      yellowClient.once('settlement:complete', () => {
        session.status = 'closed';
        resolve();
      });
      
      setTimeout(() => {
        session.status = 'closed';
        resolve();
      }, 3000);
    });
  }
}

export const sessionManager = new SessionManager();
