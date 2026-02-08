# Overview: Subdominios ENS offchain para UniPerk

Este documento describe los cambios necesarios para que los usuarios **se registren** y reciban un **subdominio offchain** bajo `uniperk.eth` (ej. `alice.uniperk.eth`), y que la lectura/escritura de permisos se haga sobre ese subdominio.

**Decisión:** gateway **self-hosted** (no proveedor externo).

---

## 1. Estado actual

| Área | Comportamiento actual |
|------|------------------------|
| **Identidad ENS** | La app usa el **nombre ENS principal** de la wallet (`useEnsName(address)` en Mainnet). Si el usuario tiene `alice.eth` como reverse record, ese es el nombre usado. |
| **Dashboard** | Muestra permisos con `useENSPermissions(ensName)` donde `ensName` es ese nombre principal. |
| **Configure** | El formulario escribe text records (`agent.uniperk.*`) en el **resolver onchain** de ese nombre, vía `setText` + `multicall` en Mainnet. |
| **Lectura de permisos** | `useENSPermissions.ts` y `lib/yellow/ens-validator.ts` leen con `getEnsText({ name: ensName, key })` en Mainnet. |
| **Chain** | ENS: Ethereum Mainnet (chainId 1). Contratos DeFi: Base. |

Problema: no hay flujo de “registro” bajo `uniperk.eth`; se asume que el usuario ya tiene un ENS y se usan sus records onchain.

---

## 2. Estado objetivo

- **Dominio raíz:** `uniperk.eth` (tu nombre).
- **Subdominios:** cada usuario tiene un subdominio offchain, ej. `alice.uniperk.eth`, `bob.uniperk.eth`.
- **Registro:** el usuario conecta wallet, elige un label (ej. `alice`), firma un mensaje, y tu backend/gateway registra `alice.uniperk.eth` → su dirección. Sin gas.
- **Permisos:** se leen y (en offchain) se escriben sobre el subdominio (`alice.uniperk.eth`), no sobre el ENS principal de la wallet.
- **Offchain:** los subdominios y sus text records viven en una base de datos y se sirven vía [CCIP Read](https://docs.ens.domains/resolvers/ccip-read); no son NFTs onchain.

---

## 3. Arquitectura offchain (CCIP Read)

Los subdominios offchain según la [documentación ENS](https://docs.ens.domains/web/subnames) y ejemplos como [gskril/ens-offchain-registrar](https://github.com/gskril/ens-offchain-registrar):

1. **Resolver en L1 (Mainnet)**  
   El nombre `uniperk.eth` debe tener un **resolver que soporte CCIP Read**. Ese resolver, cuando se le pregunta por un subnombre (ej. `alice.uniperk.eth`), devuelve una URL de gateway en lugar de datos; el cliente (viem, wagmi, etc.) luego hace una request HTTP a esa URL y obtiene address, text records, etc.

2. **Gateway offchain**  
   Un servicio (REST/Worker) que:
   - Responde a **CCIP Read**: dado un nombre como `alice.uniperk.eth`, devuelve los datos (owner address, text records `agent.uniperk.*`, etc.) desde tu base de datos.
   - Expone una **API de registro**: el usuario envía `label` + firma de un mensaje; el backend verifica la firma, comprueba que el label esté libre y cumpla reglas, y guarda `label.uniperk.eth` → `address` (y opcionalmente text records por defecto).

3. **Base de datos**  
   Almacén (Neon / Postgres) con al menos:
   - Subdominios: `label` → `address` (owner).
   - Text records por subdominio: `agent.uniperk.allowed`, `agent.uniperk.maxTrade`, etc.

4. **Escritura de “records”**  
   En offchain no hay `setText` onchain. Actualizar permisos = llamar a **tu API** que actualiza la DB; el gateway luego sirve esos valores en CCIP Read.

---

## 4. Decisión: gateway self-hosted

- **Gateway:** self-hosted (control total; despliegue y mantenimiento propios).
- **Text records:** 100% offchain en la DB del gateway; lectura vía CCIP Read (y opcionalmente API directa como fallback); escritura solo vía tu API.
- **“Mi subdominio” en la app:** la app llama a tu API “subdomain by address”; no depender de localStorage para el subdominio principal.

---

## 5. Cambios por capa

### 5.1 Infraestructura / Backend (gateway + resolver)

- **Gateway offchain**
  - Implementar (o reusar) un servicio que:
    - Responda a **CCIP Read** para cualquier `*.uniperk.eth` (address + text records desde DB).
    - Exponga **POST /register** (o similar): body con `label`, `address`, `signature` (del mensaje estándar “Claim alice.uniperk.eth”); verificar firma, validar label, persistir.
    - Exponga **PUT/PATCH** para actualizar text records de un subdominio (solo el owner, verificando firma o sesión).
  - Definir reglas del label (solo alfanumérico, longitud, reservados, etc.).

- **Resolver L1** (obligatorio con gateway self-hosted)
  - Desplegar un contrato **OffchainResolver** que devuelva la URL de tu gateway para `uniperk.eth` (y subnombres).
  - En el [ENS Manager](https://app.ens.domains), configurar `uniperk.eth` para usar ese resolver.
  - Referencia: [ensdomains/offchain-resolver](https://github.com/ensdomains/offchain-resolver), [ccip-tools](https://github.com/ensdomains/ccip-tools).

- **Base de datos (Neon / Postgres)**
  - Tabla subdominios: `label`, `owner_address`, `created_at`.
  - Tabla text records (o JSON por subdominio): por cada nombre `label.uniperk.eth`, clave `agent.uniperk.*` y valor.
  - En Workers usar [@neondatabase/serverless](https://github.com/neondatabase/serverless) para conectar sin TCP (HTTP).

### 5.2 App (Next.js)

- **Registro de subdominio (nuevo flujo)**
  - Pantalla o paso “Registrar subdominio”: input de label, mensaje a firmar (“Claim {label}.uniperk.eth”), botón “Registrar”.
  - Llamada a tu API de registro (POST con label, address, signature).
  - Tras éxito, guardar en estado (y/o obtener de API) el subdominio del usuario (`label.uniperk.eth`).

- **Saber “cuál es mi subdominio”**
  - Nuevo hook o función: `useUniperkSubdomain(address)` que llame a tu API “subdomain by address” (o equivalente).
  - Si no hay subdominio → mostrar CTA para ir a “Registrar subdominio” en lugar de “Configurar permisos” directamente.

- **Dashboard**
  - En lugar de `useEnsName({ address, chainId: 1 })`, usar el subdominio bajo `uniperk.eth` (desde API/hook).
  - Pasar ese subdominio a `PermissionCard`: `<PermissionCard ensName={subdomain ?? null} />`.
  - Si no hay subdominio, mostrar mensaje + enlace a registro.

- **Configure**
  - No usar el resolver onchain del nombre principal. Usar **solo el subdominio** (`xxx.uniperk.eth`):
    - Si los records son offchain, el formulario debe llamar a **tu API** que actualice la DB (con autenticación por wallet/firma), no `writeContract(setText)` en Mainnet.
  - El componente puede recibir `subdomain` (ej. `alice.uniperk.eth`) y enviar los mismos campos (allowed, maxTrade, tokens, slippage, expires) a la API de actualización de permisos.

- **Lectura de permisos (frontend)**
  - `useENSPermissions(ensName)` debe recibir el subdominio (`alice.uniperk.eth`). No cambiar la firma del hook; cambiar quién le pasa el nombre (dashboard/configure pasan subdominio desde el nuevo hook/API).
  - viem/wagmi con CCIP Read suelen resolver offchain si el resolver de `uniperk.eth` está configurado correctamente; si en algún entorno la resolución falla, se puede tener un fallback que lea desde tu API.

### 5.3 Agent / Backend (validación de trades)

- **ens-validator**
  - Sigue recibiendo `ensName` (el subdominio, ej. `alice.uniperk.eth`). Mientras el resolver de `uniperk.eth` sea CCIP Read y tu gateway responda, `mainnetClient.getEnsText({ name: request.ensName, key })` debería seguir funcionando.
  - Opcional: fallback a una llamada directa a tu API de permisos si ENS lookup falla (p. ej. por rate limit o timeout).

### 5.4 Configuración y docs

- **Variables de entorno**
  - `NEXT_PUBLIC_UNIPERK_ENS_DOMAIN=uniperk.eth`
  - `NEXT_PUBLIC_REGISTRATION_API_URL` (o similar) para el gateway.
  - Si hay API de “subdomain by address”: misma base URL o endpoint dedicado.

- **Documentación**
  - Actualizar `docs/ens-integration.md`: flujo de registro offchain, que los permisos son por subdominio, que la escritura es vía API cuando es offchain.
  - Opcional: doc interno de arquitectura del gateway (CCIP Read, formato de registro, almacenamiento).

---

## 6. Stack recomendado (gateway self-hosted)

| Componente | Recomendación |
|------------|----------------|
| **Gateway** | [Cloudflare Workers](https://workers.cloudflare.com/) — mismo patrón que [gskril/ens-offchain-registrar](https://github.com/gskril/ens-offchain-registrar): una Worker que sirve CCIP Read + API REST. |
| **Base de datos** | [Neon](https://neon.tech/) (Postgres serverless) — plan gratuito generoso, compatible con Workers vía [@neondatabase/serverless](https://github.com/neondatabase/serverless) (driver HTTP). |
| **Resolver L1** | [ccip-tools](https://github.com/ensdomains/ccip-tools) o [ensdomains/offchain-resolver](https://github.com/ensdomains/offchain-resolver) — desplegar en Mainnet y configurar la URL del gateway (ej. `https://ens.uniperk.xyz` o el dominio que uses). |

Puedes tomar como referencia [gskril/ens-offchain-registrar](https://github.com/gskril/ens-offchain-registrar) (Worker + registro por firma) y adaptar: en lugar de D1 usar **Neon** con el driver `@neondatabase/serverless`, el dominio a `uniperk.eth` y los text records a `agent.uniperk.*`.

---

## 7. Despliegue del resolver L1 (referencia UniPerk)

Despliegue realizado en **Ethereum Mainnet** con el script `scripts/ccip-resolver` (implementation + factory + `createOffchainResolver`). Este es el resolver configurado para `uniperk.eth` y la URL del gateway desplegado en Cloudflare Workers.

### Direcciones (Mainnet)

| Contrato | Dirección |
|----------|-----------|
| **OffchainResolver (implementation)** | `0x07Ff444C26eF40a87B4AF33608A0D752B940B48a` |
| **OffchainResolverFactory** | `0xe3c6365A92EeB3DE87aDf83746944Ba55B9fc158` |
| **Resolver de uniperk.eth** (usar en ENS Manager) | `0x6a362CBCFB1F3ef1156231D07f301ecE6DB37bb1` |

### Transacciones (Etherscan)

| Paso | TxHash | Block | Gas / Coste |
|------|--------|--------|-------------|
| Deploy OffchainResolver (impl) | [`0x8a81db1ea44cc7f3205302301bb0bfa5cf9558099968ad9435ed88145cff0263`](https://etherscan.io/tx/0x8a81db1ea44cc7f3205302301bb0bfa5cf9558099968ad9435ed88145cff0263) | 24410568 | 2 128 804 gas · ~0.000086 ETH |
| Deploy OffchainResolverFactory | [`0x0de925ec8b750fd494b0ce1e57d8767ad6bfd6b8ad29a3b6253ea8aa3d95296e`](https://etherscan.io/tx/0x0de925ec8b750fd494b0ce1e57d8767ad6bfd6b8ad29a3b6253ea8aa3d95296e) | 24410569 | 655 171 gas · ~0.000026 ETH |
| createOffchainResolver (clone) | [`0xf272528afa6e3fc40f14e8c01502ede1ff05f290ea936abdc204ac6414b4b3df`](https://etherscan.io/tx/0xf272528afa6e3fc40f14e8c01502ede1ff05f290ea936abdc204ac6414b4b3df) | 24410569 | 192 042 gas · ~0.000008 ETH |

**Total:** ~0.00012 ETH (≈ 2.98M gas).

### Configuración en ENS

En [app.ens.domains](https://app.ens.domains), el nombre **uniperk.eth** debe tener como **Resolver** la dirección:

```
0x6a362CBCFB1F3ef1156231D07f301ecE6DB37bb1
```

Ese contrato ya apunta a la URL del gateway (Worker); las resoluciones de `*.uniperk.eth` se sirven vía CCIP Read desde ese gateway.

---

## 8. Lista de tareas (checklist)

### Infraestructura (gateway self-hosted)

- [ ] **Gateway:** Implementar endpoint CCIP Read para `*.uniperk.eth` (address + text records desde DB).
- [ ] **Gateway:** Implementar POST registro (label + address + signature); validar firma y reglas de label; persistir subdominio.
- [ ] **Gateway:** Implementar endpoint para actualizar text records de un subdominio (solo owner, auth por firma).
- [ ] **Gateway:** Implementar endpoint “subdomain by address” (GET por address) para la app.
- [x] **Resolver:** Desplegar contrato OffchainResolver (ccip-tools u offchain-resolver) con la URL del gateway; configurar `uniperk.eth` en ENS Manager. *(Hecho: ver §7.)*
- [ ] **DB:** Definir esquema en Neon (subdominios + records) y migraciones; configurar `DATABASE_URL` y usar `@neondatabase/serverless` en la Worker.

### App (frontend)

- [ ] **Constantes:** Añadir `UNIPERK_ENS_DOMAIN = 'uniperk.eth'` y URL base del API de registro/gateway en env.
- [ ] **Hook:** Crear `useUniperkSubdomain(address)` que llame a la API “subdomain by address”.
- [ ] **Registro:** Añadir página o sección “Registrar subdominio” (input label, firma de mensaje, POST al gateway).
- [ ] **Dashboard:** Obtener subdominio con `useUniperkSubdomain(address)`; pasar subdominio a `PermissionCard`; si no hay subdominio, mostrar CTA a registro.
- [ ] **Configure:** Sustituir uso de nombre ENS principal por subdominio; si todo es offchain, reemplazar `writeContract(setText)` por llamadas a la API de actualización de permisos.
- [ ] **Configure:** Asegurar que solo usuarios con subdominio puedan configurar (y que el backend valide ownership).
- [ ] **useENSPermissions:** Mantener interfaz; asegurar que todos los llamantes pasen el subdominio (ya no `useEnsName(address)`).

### Agent / validación

- [ ] **ens-validator:** Probar que `getEnsText` con subdominio `xxx.uniperk.eth` resuelve vía CCIP Read contra tu gateway.
- [ ] **ens-validator (opcional):** Añadir fallback a API de permisos si ENS lookup falla.

### Documentación y QA

- [ ] Actualizar `docs/ens-integration.md` con flujo offchain, registro y API.
- [ ] Probar flujo E2E: registro → configurar permisos → dashboard muestra permisos → agent valida por subdominio.

---

## 9. Referencias

- [ENS Subdomains (L1, L2, Offchain)](https://docs.ens.domains/web/subnames)
- [Creating a Subname Registrar (onchain)](https://docs.ens.domains/wrapper/creating-subname-registrar) — útil para contexto; para offchain el flujo es API + CCIP Read.
- [CCIP Read](https://docs.ens.domains/resolvers/ccip-read)
- [gskril/ens-offchain-registrar](https://github.com/gskril/ens-offchain-registrar) — Cloudflare Workers + DB, registro por firma (adaptar a Neon en lugar de D1).
- [ensdomains/ens-contracts (subdomain registrar)](https://github.com/ensdomains/ens-contracts/tree/feature/subdomain-registrar/contracts/subdomainregistrar) — referencias onchain; opcional si más adelante quieres L1 subnames.

**Estado:** Gateway y resolver L1 desplegados. Resolver configurado en ENS para `uniperk.eth` → `0x6a362CBCFB1F3ef1156231D07f301ecE6DB37bb1`. Próximo paso: integrar la app (hook `useUniperkSubdomain`, registro, Dashboard/Configure con subdominio + API).
