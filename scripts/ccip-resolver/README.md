# Deploy OffchainResolver (ccip-tools style)

Despliega en **Ethereum Mainnet** la implementación de OffchainResolver, la Factory y crea **un resolver** con tu gateway URL y signer en un solo comando.

## Requisitos

- [Foundry](https://book.getfoundry.sh/getting-started/installation) instalado
- Wallet con ETH en Mainnet (para gas)
- **GATEWAY_URL**: URL de tu gateway (ej. `https://uniperk-ens-gateway.<tu-subdominio>.workers.dev`)
- **SIGNER_ADDRESS**: Dirección que corresponde a la `PRIVATE_KEY` del gateway (el gateway firma respuestas con esa clave)

## 1. Compilar (sin instalar nada extra)

Este proyecto usa las dependencias del **monorepo** (`contracts/lib/forge-std` y `contracts/lib/uniswap-hooks/.../openzeppelin-contracts`). No hace falta `forge install` ni otro repo git.

```bash
cd scripts/ccip-resolver
forge build
```

## 2. Obtener SIGNER_ADDRESS

Desde la raíz del repo (o desde `gateway/` si tienes `.dev.vars`):

```bash
cd gateway && node ../scripts/get-signer-address.mjs
```

Copia la dirección que imprime; es tu **SIGNER_ADDRESS**.

## 3. Desplegar (un solo comando)

Desde `scripts/ccip-resolver/`:

```bash
export GATEWAY_URL="https://uniperk-ens-gateway.TU-SUBDOMINIO.workers.dev"
export SIGNER_ADDRESS="0x..."   # la del paso 2

forge script script/DeployOffchainResolver.s.sol \
  --rpc-url mainnet \
  --broadcast \
  --private-key $DEPLOYER_PRIVATE_KEY
```

O con un archivo `.env` (no lo subas a git):

```bash
# .env en scripts/ccip-resolver/
GATEWAY_URL=https://uniperk-ens-gateway.xxx.workers.dev
SIGNER_ADDRESS=0x...
DEPLOYER_PRIVATE_KEY=0x...
```

```bash
source .env
forge script script/DeployOffchainResolver.s.sol --rpc-url mainnet --broadcast --private-key $DEPLOYER_PRIVATE_KEY
```

**RPC / 429 (rate limit):** Si ves `Error: HTTP 429` o `1015`, el RPC público te está limitando. Usa una RPC con API key:

```bash
# Ejemplo con Alchemy (cuenta gratis en alchemy.com)
export ALCHEMY_API_KEY=tu_key
forge script script/DeployOffchainResolver.s.sol \
  --rpc-url mainnet_alchemy \
  --broadcast \
  --private-key $DEPLOYER_PRIVATE_KEY
```

O pasa la URL directamente:

```bash
forge script script/DeployOffchainResolver.s.sol \
  --rpc-url "https://eth-mainnet.g.alchemy.com/v2/TU_KEY" \
  --broadcast \
  --private-key $DEPLOYER_PRIVATE_KEY
```

Otras opciones: [Infura](https://infura.io), [QuickNode](https://quicknode.com), o `https://ethereum.publicnode.com` (público, a veces más permisivo).

## 4. Salida

El script imprime algo como:

```
OffchainResolver (implementation): 0x...
OffchainResolverFactory: 0x...
>>> NEW RESOLVER (set this on uniperk.eth in ENS Manager): 0x...
```

Copia la dirección **NEW RESOLVER** y asígnala como resolver de **uniperk.eth** en [app.ens.domains](https://app.ens.domains) (con la wallet que sea owner de uniperk.eth).

## Script todo-en-uno (opcional)

Desde la **raíz del repo** puedes usar el script que obtiene el signer y despliega:

```bash
./scripts/deploy-offchain-resolver.sh "https://tu-gateway.workers.dev"
```

(Necesitas tener `DEPLOYER_PRIVATE_KEY` en el entorno y haber instalado las dependencias en `scripts/ccip-resolver/` y haber hecho `forge build`.)
