# Revisión de arquitectura — UniPerk

**Rol:** Arquitecto de software especializado en dApps Web3  
**Alcance:** Overview por capas, implementaciones, escalabilidad, mantenibilidad, simpleza y viabilidad de producción.

---

## 1. Overview por partes

### 1.1 Frontend (`app/`)

| Parte | Función |
|-------|--------|
| **app/page.tsx** | Landing: presentación del producto, redirección a `/dashboard` si hay wallet conectada. |
| **app/dashboard/page.tsx** | Dashboard del usuario: tier (UniPerkHook), stats de trades/volumen, permisos ENS, enlace a BaseScan. |
| **app/configure/page.tsx** | Configuración de permisos: formulario que escribe en ENS (Mainnet) vía PublicResolver `setText` + multicall. |
| **app/trade/page.tsx** | Trading con Yellow: conectar WebSocket, crear/cerrar sesión, ejecutar trades off-chain, historial en sesión. |
| **components/providers.tsx** | Wagmi + React Query + RainbowKit (Base + Mainnet, SSR). |
| **components/wallet-connect.tsx** | Botón de conexión de wallet. |
| **components/ens-config-form.tsx** | Formulario ENS con validación; escribe `agent.uniperk.*` en el resolver del ENS del usuario. |
| **components/permission-card.tsx** | Muestra permisos leídos desde ENS (useENSPermissions). |
| **components/tier-badge.tsx** | Muestra tier y descuento de fee desde UniPerkHook (useUserTier). |
| **hooks/useENSPermissions.ts** | React Query sobre Mainnet para leer text records ENS. |
| **hooks/useUserTier.ts** | useReadContracts a UniPerkHook (tier, tradeCount, tradeVolume, thresholds, discounts). |
| **hooks/useYellow.ts** | Orquesta YellowClient + SessionManager + TradingEngine; expone connect, createSession, closeSession, executeTrade. |
| **lib/wagmi.ts** | Config wagmi/RainbowKit y constantes de contratos (CONTRACTS) y chain IDs. |
| **lib/contracts.ts** | Direcciones (ADDRESSES), ABIs de UniPerkHook y AgentRegistry, TIERS. |
| **lib/utils.ts** | Utilidad `cn()` (clsx + tailwind-merge). |

### 1.2 SDK Yellow (`app/lib/yellow/`)

| Archivo | Función |
|---------|--------|
| **client.ts** | Cliente WebSocket a Yellow (`NEXT_PUBLIC_YELLOW_WS` o clearnet), reconexión (hasta 5 intentos), eventos (connected, session:created, state:update, settlement:complete, error). |
| **session.ts** | SessionManager: crear sesión (protocol `uniperk-trading-v1`, allocations USDC, firma del usuario), cerrar sesión (envío + espera de `settlement:complete`). **Incluye fallback con setTimeout que resuelve con sesión mock si no hay respuesta en 5s.** |
| **trading.ts** | TradingEngine: validación ENS (validateENSPermissions), envío de `swap` firmado al WebSocket. **Incluye fallback con setTimeout que devuelve TradeResult mock a 1s.** |
| **settlement.ts** | `settleToUniswapV4`: codifica hookData (agent, user) y llama a PoolManager.swap en Base; `encodeAgentHookData` para uso externo. |
| **ens-validator.ts** | Lee ENS en Mainnet, construye ENSPermissions (maxTrade en 6 decimales: `(maxTrade||'1000')+'000000'`), valida allowed, maxTrade, tokens, expires. |
| **types.ts** | Tipos: YellowConfig, TradingSession, Allocation, TradeRequest, TradeResult, ENSPermissions, ValidationResult, MessageSigner. |
| **index.ts** | Re-export de client, session, trading, ens-validator, settlement y tipos. |

### 1.3 Contratos (`contracts/src/`)

| Contrato | Función |
|----------|--------|
| **AgentRegistry.sol** | Registro de agentes: `registerAgent(agent, limit, ensName)` **solo por owner**; `revokeAgent` por owner del agente o owner del contrato; `updateTradeLimit` por owner del agente; `validateTrade(agent, tradeSize)` usado por el hook. |
| **UniPerkHook.sol** | Hook Uniswap V4: `beforeSwap` (decodifica agent/user de hookData, valida con AgentRegistry si es trade de agente, aplica descuento por tier); `afterSwap` (incrementa tradeCount/tradeVolume, actualiza tier); tier BRONZE/SILVER/GOLD/PLATINUM con umbrales 10/50/200. |
| **IAgentRegistry.sol** | Interfaz del registry para el hook. |

### 1.4 Agente y scripts

- **agent/** OpenClaw: configuración y skills (Yellow SDK para connect, deposit, trade).
- **scripts/** Deploy del hook, creación de pool, liquidez, swap; setup de wallet y fondos para el agente.

---

## 2. Revisión de implementaciones

### 2.1 Puntos correctos

- **ENS:** Formulario escribe en PublicResolver con multicall; lectura en Mainnet; validator convierte maxTrade a 6 decimales y valida contra `request.amount` en bigint. Consistente con “max trade en USDC”.
- **Hook V4:** Uso correcto de BaseHook, hookData (agent, user), validación on-chain con AgentRegistry y aplicación de fee por tier.
- **Wagmi/React Query:** Uso adecuado de cadenas (Base + Mainnet), ABIs mínimos necesarios, cache con React Query para ENS.
- **Estructura:** Separación clara app / components / hooks / lib; tipos centralizados en `lib/yellow/types.ts`.

### 2.2 Duplicación y configuración

- **Direcciones:** Definidas en `lib/wagmi.ts` (CONTRACTS) y en `lib/contracts.ts` (ADDRESSES). Debería existir una única fuente de verdad (p. ej. solo en `contracts.ts` y que wagmi importe si hace falta).
- **Cliente Mainnet:** Creado en `useENSPermissions.ts` y en `ens-validator.ts`. Conviene un único `mainnetClient` en `lib` (o en un módulo ENS) y reutilizarlo.

### 2.3 Comportamiento mock / no producción

- **session.ts:** Si el backend Yellow no responde con `session:created`, a los 5 segundos se resuelve con una sesión mock y se guarda en memoria. El usuario cree que tiene sesión real pero no hay sesión en Yellow.
- **trading.ts:** Si no llega `state:update`, a 1s se resuelve con un `TradeResult` mock (`receivedAmount = request.amount / 3000n`). No hay trade real off-chain ni garantía de settlement.
- **Conclusión:** La integración Yellow está preparada a nivel de protocolo (mensajes, firma, eventos), pero los fallbacks convierten el flujo en una demo que puede “satisfacer” al UI sin backend real. Para producción hay que eliminar estos timeouts o sustituirlos por fallo explícito y/o integración real con Nitrolite/backend Yellow.

### 2.4 Lógica de negocio y UX

- **AgentRegistry:** `registerAgent` es `onlyOwner`. Solo el owner del contrato puede dar de alta agentes. Para un producto donde cada usuario tenga “su agente”, haría falta otro modelo (p. ej. que el usuario registre su propio agente o un factory que registre con `msg.sender` como owner).
- **Trade page:** Dirección de agente hardcodeada (`0x742d35Cc6634C0532925a3b844Bc454e4e3447Fe`). Debería venir de configuración, ENS o selección de agente autorizado.
- **Settlement:** El cierre de sesión envía `close_session` por WebSocket y espera `settlement:complete`. El módulo `settlement.ts` (settleToUniswapV4) parece pensado para que el settlement on-chain lo ejecute el backend de Yellow o el agente; el frontend no llama directamente a `settleToUniswapV4` en el flujo actual de la página de trade.

### 2.5 Pequeñas mejoras

- **permission-card.tsx:** Slippage se muestra como `(slippage / 100).toFixed(2)%`; 50 bps = 0.50%. Correcto.
- **useUserTier:** Cálculo de siguiente tier y trades restantes bien alineado con constantes on-chain.
- **ens-config-form:** Validación de maxTrade, slippage, tokens y expires antes de enviar la tx; manejo de “no ENS” y de resolver.

---

## 3. Calificación por dimensiones

### 3.1 Escalabilidad — **6/10**

- **Frontend:** Stateless; escala horizontalmente con el número de usuarios. Una instancia de WebSocket por pestaña/usuario; límite en el lado del servicio Yellow, no en el front.
- **Contratos:** Escalables (mappings por usuario/agente; umbrales fijos). AgentRegistry con `onlyOwner` para registro es un cuello de botella operativo si se quieren muchos agentes de muchos usuarios.
- **Riesgos:** Sin rate limiting ni backpressure en el cliente Yellow; reintentos de reconexión fijos (5). Si Yellow exige autenticación o límites por IP/app, no está contemplado en el código actual.

### 3.2 Mantenibilidad — **6/10**

- **Ventajas:** Estructura de carpetas clara, tipos en un solo sitio, hooks reutilizables.
- **Debilidades:** Lógica mock mezclada con flujo real en session/trading (dificulta saber qué es “real” en producción). Dos sitios con direcciones/ABIs y dos clientes Mainnet. Falta documentación en código para flujo Yellow (qué mensajes espera el backend, qué hace el fallback).

### 3.3 Simpleza — **8/10**

- Flujo fácil de seguir: ENS → permisos; Yellow → sesión → trades → cierre → settlement. Pocas capas; ABIs recortados; UI directa. La complejidad está en la integración real con Yellow, no en el diseño general.

### 3.4 Viabilidad de producción (versión actual) — **4/10**

- **Bloqueantes:**
  1. **Mocks en Yellow:** session y trading no deben resolver con datos falsos; deben fallar o depender de un backend/Nitrolite real.
  2. **Registro de agentes:** Con `onlyOwner`, los usuarios no pueden auto-registrar agentes; el producto actual no es self-service.
  3. **Trade page:** Agente fijo en código; no es aceptable en producción.
  4. **WalletConnect:** `NEXT_PUBLIC_WALLETCONNECT_ID` por defecto `'demo'`; en producción debe ser un Project ID real.
- **Importantes:**
  5. Sin tests E2E ni tests unitarios de app/lib (solo tests de librerías en contracts).
  6. Sin error boundaries en React; un fallo en un hook puede tumbar toda la app.
  7. Duplicación de config (addresses, mainnet client) aumenta riesgo de desincronización.

---

## 4. Ajustes recomendados para producción

### 4.1 Críticos

1. **Yellow:**  
   - Quitar los `setTimeout` que resuelven con sesión/trade mock en `session.ts` y `trading.ts`.  
   - Sustituir por: timeout que rechace la promesa con un error claro (“Yellow no respondió en X segundos”) o integrar con el backend/Nitrolite real y tratar solo respuestas reales del WebSocket.

2. **AgentRegistry:**  
   - Decidir modelo de registro:  
     - Opción A: Permitir que usuarios registren su propio agente (p. ej. `registerAgent` por `msg.sender` con límite y ENS).  
     - Opción B: Mantener onlyOwner y exponer un proceso claro de onboarding de agentes (y documentarlo).

3. **Trade page:**  
   - No hardcodear la dirección del agente. Obtenerla de: lista de agentes autorizados (AgentRegistry + owner), configuración, o selector en UI.

4. **Config:**  
   - Usar `NEXT_PUBLIC_WALLETCONNECT_ID` real en producción y no valor por defecto `'demo'`.

### 4.2 Recomendados

5. **Una sola fuente de verdad para chain/contracts:**  
   - Un único módulo (p. ej. `lib/contracts.ts`) con addresses y chainId; wagmi y demás importan desde ahí. Eliminar duplicación en `wagmi.ts`.

6. **Cliente Mainnet único:**  
   - Crear `lib/ens-client.ts` (o similar) con un solo `mainnetClient` y usarlo en `useENSPermissions` y en `ens-validator.ts`.

7. **Tests:**  
   - Unit tests para hooks (useUserTier, useENSPermissions, useYellow con client mock).  
   - Al menos un E2E (conectar wallet, leer ENS, tal vez solo lectura de tier en Base) para validar integración con contratos y ENS.

8. **Resiliencia UI:**  
   - Añadir error boundaries en layout o en rutas principales para que un error en un componente no rompa toda la app.

9. **Documentación:**  
   - En `session.ts` y `trading.ts`, comentar que los mensajes deben coincidir con el protocolo Yellow/Nitrolite y que no debe haber fallbacks que simulen éxito.  
   - En README o docs, indicar que en producción se requiere backend Yellow/Nitrolite y WalletConnect Project ID.

### 4.3 Opcionales

10. **Settlement:** Dejar documentado quién debe llamar a `settleToUniswapV4` (backend Yellow vs frontend vs agente) para evitar malentendidos en mantenimiento.  
11. **Variables de entorno:** Documentar en `.env.example`: `NEXT_PUBLIC_WALLETCONNECT_ID`, `NEXT_PUBLIC_YELLOW_WS`.  
12. **Monitoring:** En producción, considerar logging de eventos Yellow (conexión, sesión, errores) y métricas de uso del hook (trades, volumen por usuario).

---

## 5. Resumen

- **Arquitectura:** Clara y alineada con el stack (ENS + Yellow + Uniswap V4). La separación por capas y la responsabilidad de cada parte son entendibles.
- **Implementación:** ENS y contratos están bien encaminados; el cuello de botella es la integración real con Yellow (hoy con mocks) y el modelo de registro de agentes (onlyOwner).
- **Producción:** No recomendable en el estado actual por mocks en Yellow, registro centralizado de agentes, agente hardcodeado y falta de tests y de manejo robusto de errores. Con los ajustes críticos y recomendados anteriores, la base del proyecto es viable para una primera versión en producción controlada (beta) y luego iterar sobre registro de agentes y experiencia de settlement.
