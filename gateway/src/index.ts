import { Router, createCors } from 'itty-router'
import type { Env } from './env.d'
import { getCcipRead } from './handlers/ccip'
import { register } from './handlers/register'
import { getSubdomainByAddressHandler } from './handlers/subdomain'
import { updatePermissions } from './handlers/permissions'

const { preflight, corsify } = createCors()
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
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.handle(request, env).then(corsify)
  },
}
