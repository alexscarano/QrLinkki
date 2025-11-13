# Estrutura de pastas — QrLinkki.Web

Documento de referência para organização das pastas e convenções da parte web/mobile (Expo + expo-router) do projeto QrLinkki.

> Objetivo: deixar a estrutura clara, previsível e escalável para desenvolvimento em equipe.

## Visão geral recomendada

- app/: páginas/rotas do aplicativo (expo-router). Use route groups para comportamentos distintos — ex.: `(auth)` e `(tabs)`.
- lib/: código de infra-app (API client, auth helpers, storage e tipos compartilhados).
- components/: componentes React reutilizáveis e primitives de UI.
- hooks/: hooks personalizados reutilizáveis.
- constants/: tokens visuais e configurações (tema, cores, etc.).
- assets/: imagens e arquivos estáticos.
- docs/: documentação do frontend (este arquivo).
- tests/ ou __tests__/: testes unitários / integração.

## Árvore sugerida (exemplo)

```
app/
  _layout.tsx                # Root layout (ThemeProvider, ToastProvider, registro de handler 401)
  modal.tsx
  (auth)/                    # Grupo de rotas para autenticação (guest-only)
    _layout.tsx              # Guest-guard: verifica token e redireciona se já logado
    login.tsx                # Full-screen mobile-first
    register.tsx
  (tabs)/                    # Grupo do app principal (usuário autenticado)
    _layout.tsx              # Layout de tabs / navegação principal
    index.tsx                # Home da tab principal
    explore.tsx
  links/
    [code].tsx               # Rota dinâmica /links/[code]
    new.tsx                  # Criar novo link

lib/
  api.ts                     # Cliente HTTP centralizado (BASE_URL via env, timeout, ApiError)
  auth.ts                    # Funções de alto nível: login, logout, decode token, validar exp
  storage.ts                 # Abstração do armazenamento do token (SecureStore + fallbacks)
  types.ts                   # Tipos/Interfaces comuns

components/
  ui/
    Toast.tsx
    Button.tsx
    Input.tsx
  external-link.tsx
  themed-text.tsx
  themed-view.tsx

hooks/
  use-color-scheme.ts
  use-theme-color.ts
  useAuth.ts                  # (opcional) hook que encapsula login/logout/isAuthenticated

constants/
  theme.ts

assets/
  images/

docs/
  estrutura-pastas.md        # Este arquivo

tests/                       # unit / integration

```

## Convenções e boas práticas

- Route groups do `expo-router`: use grupos para comportamentos distintos:
  - `(auth)` para telas de autenticação (guest-only).
  - `(tabs)` para a navegação principal (usuário autenticado).
- Layouts: cada route group tem um `_layout.tsx` responsável por providers e comportamento local (ex.: guest-guard). O `app/_layout.tsx` é o root provider para Theme + Toast + registro do handler global de 401.
- Evite duplicação de telas: mantenha apenas `app/(auth)/login.tsx`. Se precisar compatibilidade com `/login`, crie `app/login.tsx` como passthrough (veja exemplo abaixo).

### Passthrough example (compatibilidade de rota)

```ts
// app/login.tsx (passthrough)
export { default } from './(auth)/login';
export const options = { headerShown: false };
```

### Cliente API (`lib/api.ts`)

- Centralize chamadas HTTP, erros e token:
  - Não hardcode `BASE_URL`. Use `process.env` ou `expo-constants` (`Constants.manifest?.extra?.apiBaseUrl`).
  - Use `AbortController` para timeout (ex.: 10s).
  - Lance erros com uma forma consistente (ex.: `ApiError` com `status`, `message`, `body`).
  - Exponha `setToken` e `registerUnauthorizedHandler(fn)` para limpar sessão em 401 sem dependências circulares.

### Armazenamento do token

- `lib/storage.ts`: SecureStore no mobile, AsyncStorage fallback e `localStorage` no web. Exporte `setTokenStorage`, `getTokenStorage`, `removeTokenStorage`.

### JWT e segurança

- Ao verificar expiração, trate tokens não-decodificáveis ou sem `exp` como inválidos/expirados (mais seguro).

## Fluxo de 401 centralizado (recomendação)

- `lib/api.ts` detecta 401 e chama um handler registrado (`registerUnauthorizedHandler`). Depois lança erro.
- `app/_layout.tsx` ou `AuthProvider` registra o handler que:
  - Limpa storage (`removeTokenStorage()`),
  - Chama `api.setToken(null)`,
  - Navega para `/login` (via `router.replace('/login')`) e
  - Opcionalmente mostra um toast informando 'Sessão expirada'.

Esquema (simplificado):

```ts
// lib/api.ts (esquema)
let unauthorizedHandler: (() => void) | null = null;
export function registerUnauthorizedHandler(fn: () => void) { unauthorizedHandler = fn }

if (res.status === 401) {
  unauthorizedHandler?.();
  throw new ApiError(401, 'Unauthorized');
}
```

## Checklist de adoção

- [ ] Root `app/_layout.tsx` inicializa providers e registra handler 401.
- [ ] `app/(auth)/_layout.tsx` valida token e redireciona se já logado; tokens inválidos são removidos.
- [ ] `lib/api.ts` com `setToken`, `registerUnauthorizedHandler`, timeout e erros normalizados.
- [ ] `lib/storage.ts` com SecureStore + AsyncStorage + web fallback.
- [ ] Componentes de UI em `components/ui/`.
- [ ] Documentação com `docs/` e README atualizado com variáveis de ambiente (`API_BASE_URL`).

## Próximos passos sugeridos

1. Implementar `registerUnauthorizedHandler` em `lib/api.ts` e registrar no `app/_layout.tsx` para limpar sessão e redirecionar em 401.
2. Atualizar `app/(auth)/_layout.tsx` para tratar tokens não-decodificáveis como expirados.
3. Remover duplicatas de rota (ou transformar em passthroughs com `headerShown: false`).
4. Documentar no `README` como configurar `API_BASE_URL` para dev/prod e instruções rápidas para rodar o Expo.

---

Se quiser, eu aplico automaticamente as mudanças seguras: (A) `lib/api.ts` com `registerUnauthorizedHandler`, (B) ajuste em `app/(auth)/_layout.tsx` para tokens inválidos e (C) transformar `app/login.tsx` e `app/register.tsx` em passthroughs. Diga quais deseja que eu implemente agora.
