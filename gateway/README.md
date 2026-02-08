# UniPerk ENS Gateway

Gateway offchain para subdominios ENS bajo `uniperk.eth`. Sirve respuestas **CCIP Read** (resolución de nombres y text records) y una **API REST** para registro y actualización de permisos.

## Stack

- **Runtime:** Cloudflare Workers
- **Base de datos:** Neon (Postgres), vía `@neondatabase/serverless`
- **Dominio:** subdominios `*.uniperk.eth`

## Configuración

1. **Neon:** Crear proyecto en [Neon](https://neon.tech), copiar la connection string.
2. **Tablas:** Ejecutar `schema.sql` en el SQL Editor de Neon.
3. **Secrets en Wrangler:**
   - `PRIVATE_KEY`: clave privada (hex con `0x`) que usará el contrato OffchainResolver para verificar firmas. Debe coincidir con el signer configurado en el resolver.
   - `DATABASE_URL`: connection string de Neon (ej. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).

```bash
cd gateway
cp .dev.vars.example .dev.vars
# Editar .dev.vars con PRIVATE_KEY y DATABASE_URL
npm install
npm run dev
```

Para producción:

```bash
wrangler secret put PRIVATE_KEY
wrangler secret put DATABASE_URL
npm run deploy
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/lookup/:sender/:data` | CCIP Read (ENS). `sender` = dirección del contrato, `data` = calldata ABI-encoded. |
| GET | `/subdomain?address=0x...` | Devuelve el subdominio registrado para esa address (`{ "subdomain": "alice.uniperk.eth" }` o `null`). |
| POST | `/register` | Registra un subdominio. Body: `{ "label", "address", "signature", "message" }`. Mensaje: `Claim {label}.uniperk.eth`. |
| PATCH / PUT | `/permissions` | Actualiza text records de permisos. Body: `{ "name", "address", "signature", "message", "permissions" }`. Mensaje: `Update permissions for {name}`. Solo el owner puede actualizar. |

## Registro

El cliente debe:

1. Construir el mensaje: `Claim alice.uniperk.eth` (por ejemplo).
2. Firmar con la wallet (personal_sign).
3. Enviar `POST /register` con `{ "label": "alice", "address": "0x...", "signature": "0x...", "message": "Claim alice.uniperk.eth" }`.

El label debe ser alfanumérico o guión, 1–63 caracteres.

## Permisos (text records)

Claves usadas por el agente: `agent.uniperk.allowed`, `agent.uniperk.maxTrade`, `agent.uniperk.tokens`, `agent.uniperk.slippage`, `agent.uniperk.expires`. Se crean por defecto al registrar y se actualizan con `PATCH /permissions` (firmando el mensaje `Update permissions for {name}`).

## Resolver L1

Tras desplegar el gateway, hay que desplegar el **OffchainResolver** en Mainnet (URL del Worker + signer) y asignar ese resolver a `uniperk.eth` en el [ENS Manager](https://app.ens.domains).

- **Guía paso a paso con ccip-tools:** [docs/ccip-tools-deploy.md](../docs/ccip-tools-deploy.md).
- **Obtener la dirección del signer** (la misma que usa tu `PRIVATE_KEY` del gateway):
  ```bash
  PRIVATE_KEY=0x... node scripts/get-signer-address.mjs
  ```
  O desde `gateway/` con `.dev.vars` configurado: `node ../scripts/get-signer-address.mjs`.
