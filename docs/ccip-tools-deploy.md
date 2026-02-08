# Desplegar OffchainResolver con ccip-tools

Opciones para desplegar el contrato **OffchainResolver** en Ethereum Mainnet y configurar la **URL del gateway** y el **signer** (dirección que verifica las firmas de tu gateway).

## Requisitos

- Wallet con ETH en Mainnet (para gas)
- **Gateway URL** ya desplegada (tu Worker de Cloudflare, ej. `https://uniperk-ens-gateway.<tu-subdominio>.workers.dev`)
- **Signer address**: la dirección pública de la `PRIVATE_KEY` que usa el gateway. Obtenerla con:
  ```bash
  cd gateway && node ../scripts/get-signer-address.mjs
  ```
  (o desde la raíz: `PRIVATE_KEY=0x... node scripts/get-signer-address.mjs`)

---

## Opción B (recomendada): Script en este repo — un solo comando

En este repo ya está todo listo para desplegar **implementation + factory + createOffchainResolver** con Foundry.

1. **Compilar** (usa las libs del monorepo en `contracts/lib`; no hace falta `forge install` ni otro repo):
   ```bash
   cd scripts/ccip-resolver
   forge build
   ```

2. **Desplegar** (desde la raíz del repo):
   ```bash
   export DEPLOYER_PRIVATE_KEY=0x...   # wallet con ETH en Mainnet
   ./scripts/deploy-offchain-resolver.sh "https://uniperk-ens-gateway.TU-SUBDOMINIO.workers.dev"
   ```
   El script usa el **signer** de `gateway/.dev.vars` (PRIVATE_KEY) si existe; si no, define `SIGNER_ADDRESS` a mano.

   O desde `scripts/ccip-resolver/` con env vars:
   ```bash
   export GATEWAY_URL="https://tu-gateway.workers.dev"
   export SIGNER_ADDRESS="0x..."   # salida de get-signer-address.mjs
   forge script script/DeployOffchainResolver.s.sol --rpc-url mainnet --broadcast --private-key $DEPLOYER_PRIVATE_KEY
   ```

3. **Copiar la dirección** que imprime `>>> NEW RESOLVER` y asignarla como resolver de **uniperk.eth** en [app.ens.domains](https://app.ens.domains).

Guía detallada: [scripts/ccip-resolver/README.md](../scripts/ccip-resolver/README.md).

---

## Opción A: Interfaz web de ccip-tools (clonar repo externo)

1. **Clonar ccip-tools**
   ```bash
   git clone https://github.com/ensdomains/ccip-tools.git
   cd ccip-tools
   ```

2. **Contratos: dependencias e imports**
   - Los contratos usan imports por URL de OpenZeppelin. Para compilar con Foundry hay que usar dependencias locales:
   ```bash
   cd contracts
   forge install OpenZeppelin/openzeppelin-contracts --no-commit
   ```
   - Sustituir en los `.sol` los imports tipo:
     `import "https://github.com/OpenZeppelin/..."`
     por:
     `import "@openzeppelin/contracts/access/Ownable.sol";` (y similares según la ruta).
   - Añadir en `foundry.toml` (o crear uno):
     ```toml
     remappings = ["@openzeppelin/=lib/openzeppelin-contracts/"]
     ```
   - Ajustar las rutas de los imports de los otros contratos del repo (p. ej. `./IExtendedResolver.sol`) para que apunten a los archivos locales.
   - Ejecutar `forge build`.

3. **Desplegar implementation y factory**
   - Desplegar primero la **implementación** de `OffchainResolver` (constructor vacío).
   - Desplegar **OffchainResolverFactory** pasando la dirección de esa implementación.
   - Ejemplo con Forge (tras ajustar imports y nombres):
     ```bash
     forge create OffchainResolver --rpc-url <MAINNET_RPC> --private-key <DEPLOYER_KEY>
     forge create OffchainResolverFactory --constructor-args <OFFCHAIN_RESOLVER_IMPL_ADDRESS> --rpc-url <MAINNET_RPC> --private-key <DEPLOYER_KEY>
     ```
   - Anotar la dirección de la **Factory**.

4. **Interfaz web**
   ```bash
   cd web
   yarn install
   ```
   - En el código de la web (stores o env) configurar la dirección de la **Factory** y la RPC de Mainnet.
   - Ejecutar `yarn dev`, abrir el navegador, conectar la wallet (Mainnet).
   - En el formulario:
     - **Gateway URL:** tu URL del Worker (ej. `https://uniperk-ens-gateway.<xxx>.workers.dev`).
     - **Signer:** la dirección obtenida con `get-signer-address.mjs`.
   - Llamar a “Create” / “Deploy resolver”; la web llamará a `factory.createOffchainResolver(url, [signer])`.
   - Copiar la dirección del **nuevo resolver** que emita el evento o muestre la UI.

5. **Asignar el resolver a uniperk.eth**
   - Ir a [app.ens.domains](https://app.ens.domains) → conectar la wallet que **posee** `uniperk.eth`.
   - Abrir **uniperk.eth** → pestaña de **Resolver** (o “Registro”).
   - Cambiar el resolver a la **dirección del OffchainResolver** creada en el paso anterior.
   - Confirmar la transacción.

---

## Resumen

| Paso | Acción |
|------|--------|
| 1 | Obtener **signer address** con `scripts/get-signer-address.mjs` (usa la misma `PRIVATE_KEY` que el gateway). |
| 2 | Desplegar **OffchainResolver** (impl) y **OffchainResolverFactory** en Mainnet (ccip-tools o script propio). |
| 3 | Llamar a **factory.createOffchainResolver(gatewayUrl, [signer])** (por la web de ccip-tools o por script). |
| 4 | En [app.ens.domains](https://app.ens.domains), asignar ese **resolver** a **uniperk.eth**. |

Después de esto, las resoluciones de `*.uniperk.eth` pasan por tu gateway vía CCIP Read.
