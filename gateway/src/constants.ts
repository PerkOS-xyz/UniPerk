export const PARENT_DOMAIN = 'uniperk.eth'

/** Allowed label pattern: alphanumeric + hyphen, 1–63 chars */
export const LABEL_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/

export const AGENT_KEYS = [
  'agent.uniperk.allowed',
  'agent.uniperk.maxTrade',
  'agent.uniperk.tokens',
  'agent.uniperk.slippage',
  'agent.uniperk.expires',
] as const
