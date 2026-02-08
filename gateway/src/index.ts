import { Router, createCors } from 'itty-router'
import type { Env } from './env.d'
import { getCcipRead } from './handlers/ccip'
import { register } from './handlers/register'
import { getSubdomainByAddressHandler } from './handlers/subdomain'
import { updatePermissions } from './handlers/permissions'

const { preflight, corsify } = createCors({
  origins: ['*'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'OPTIONS'],
  headers: { 'Access-Control-Allow-Headers': 'Content-Type' },
})
const router = Router()

router
  .all('*', preflight)
  .get('/lookup/:sender/:data', (req, env: Env) => getCcipRead(req, env))
  .get('/lookup/:sender/:data.json', (req, env: Env) => getCcipRead(req, env))
  .get('/subdomain', (req, env: Env) => getSubdomainByAddressHandler(req, env))
  .post('/register', (req, env: Env) => register(req, env))
  .patch('/permissions', (req, env: Env) => updatePermissions(req, env))
  .put('/permissions', (req, env: Env) => updatePermissions(req, env))
  .all('*', () => new Response('Not found', { status: 404 }))

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await router.handle(request, env)
      return response ? corsify(response) : corsify(new Response(JSON.stringify({ error: 'No handler' }), { status: 500, headers: { 'Content-Type': 'application/json' } }))
    } catch (err) {
      const body = JSON.stringify({ error: 'Internal Server Error', message: err instanceof Error ? err.message : String(err) })
      return corsify(new Response(body, { status: 500, headers: { 'Content-Type': 'application/json' } }))
    }
  },
}
