import type { YellowConfig } from './types';

export const YELLOW_CONFIG: YellowConfig = {
  // Production Yellow Network - Base mainnet
  wsUrl: process.env.NEXT_PUBLIC_YELLOW_WS || 'wss://clearnet.yellow.com/ws',
  chainId: 8453,
  custodyAddress: '0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6'
};

type EventCallback = (data: unknown) => void;

export class YellowClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnects = 5;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  public isConnected = false;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(YELLOW_CONFIG.wsUrl);
        
        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected', {});
          resolve();
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.emit('disconnected', {});
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.emit('message', message);
            this.handleMessage(message);
          } catch {
            // Silent fail on parse errors
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: Record<string, unknown>) {
    const type = message.type as string;
    switch (type) {
      case 'session_created':
        this.emit('session:created', message);
        break;
      case 'state_update':
        this.emit('state:update', message);
        break;
      case 'settlement_complete':
        this.emit('settlement:complete', message);
        break;
      case 'error':
        this.emit('protocol:error', message);
        break;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnects) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect().catch(() => {}), 2000 * this.reconnectAttempts);
    }
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  once(event: string, callback: EventCallback) {
    const wrapper: EventCallback = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }

  private emit(event: string, data: unknown) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  send(data: string | object) {
    if (!this.ws || !this.isConnected) {
      throw new Error('Not connected to Yellow Network');
    }
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.ws.send(payload);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
  }
}

export const yellowClient = new YellowClient();
