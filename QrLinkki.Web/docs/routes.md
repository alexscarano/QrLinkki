# Mapa de rotas — QrLinkki.Web

Este arquivo lista as páginas/rotas existentes dentro de `app/` e dá uma breve descrição do propósito de cada uma. Serve como referência rápida para roteamento do Expo Router (web + mobile).

## Resumo das rotas

- `app/welcome.tsx` → `/welcome`
  - Passthrough que reexporta `/(auth)/welcome`. Tela de boas-vindas apresentada a usuários não autenticados.
- `app/login.tsx` → `/login`
  - Passthrough para `/(auth)/login`. Tela de login.
- `app/register.tsx` → `/register`
  - Passthrough para `/(auth)/register`. Tela de registro.
- `app/dashboard.tsx` → `/dashboard`
  - Tela do dashboard (ex.: rota acessível após login).
- `app/modal.tsx` → `/modal`
  - Tela modal (Stack screen com `presentation: 'modal'`).

## Route groups

- `app/(auth)/_layout.tsx` → Grupo `/(auth)`
  - Layout e lógica de autenticação. Valida token ao entrar no grupo e redireciona para `/` (app principal) se houver token válido.
  - Arquivos dentro do grupo:
    - `app/(auth)/index.tsx` → redireciona para `/welcome` (ponto de entrada do grupo auth).
    - `app/(auth)/welcome.tsx` → `/welcome` — welcome screen.
    - `app/(auth)/login.tsx` → `/login` — login screen.
    - `app/(auth)/register.tsx` → `/register` — register screen.

- `app/(tabs)/_layout.tsx` → Grupo `/(tabs)` (app principal em abas)
  - Define `Tabs` e configurações do app principal.
  - Arquivos dentro do grupo:
    - `app/(tabs)/index.tsx` → `/` (aba principal/home)
    - `app/(tabs)/explore.tsx` → `/explore` (aba Explore)

## Rotas dinâmicas

- `app/links/[code].tsx` → `/links/:code`
  - Página dinâmica para exibir um link/QR por código (param `code`).
- `app/links/new.tsx` → `/links/new`
  - Criar novo link.

## Arquivos utilitários dentro de `app/`

- `app/lib/api.ts` — helpers de API (não é rota)
- `app/lib/auth.ts` — helpers de autenticação (não é rota)

## Notas importantes

- Passthroughs: vários arquivos no nível `app/` (ex.: `app/login.tsx`) apenas reexportam a implementação real que vive em `app/(auth)/...`. Isso facilita exposições top-level para web sem duplicar lógica.
- `headerShown: false`: o projeto define `headerShown: false` para `/(auth)` e para páginas específicas (`login`, `register`, `welcome`) no `app/_layout.tsx` para evitar o header padrão do Stack quando usamos um header personalizado (`AuthHeader`).
- Anchor: a configuração `unstable_settings.anchor` foi ajustada para `'(auth)'` para que usuários não autenticados entrem no fluxo de autenticação (welcome/login). O `AuthLayout` redireciona automaticamente para `'/'` quando encontra um token válido.

## Como testar (rápido)

1. Reinicie o expo com cache limpo:

```powershell
npx expo start -c
```

2. Cenários principais:
- Sem token: abra a app — deve entrar em `/welcome`.
- Com token: `app/(auth)/_layout.tsx` deve redirecionar para `/` automaticamente.

3. Teste rotas manualmente no browser (ex.: `http://localhost:19006/welcome`, `.../login`, `.../links/abc123`).

## Próximos passos sugeridos

- Centralizar o header do grupo `/(auth)` no seu `_layout.tsx` para evitar repetir `AuthHeader` em cada página.
- Criar um componente `components/ui/Header.tsx` genérico com variantes (`transparent` / `solid`) para unificar comportamento e estilo.

---

Arquivo gerado automaticamente em: `docs/routes.md`
