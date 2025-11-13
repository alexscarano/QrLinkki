# QrLinkki

## Descrição

QrLinkki é um projeto em C# com arquitetura baseada em camadas (Domain Driven Design) destinado à geração e gerenciamento de QR Codes e links curtos (URL shortener). Organizado para escalabilidade, manutenibilidade e separação clara de responsabilidades, o sistema permite criar, associar, consultar e rastrear links encurtados e seus respectivos QR Codes, gerando estatísticas e facilitando o acesso.

## Estrutura do Projeto

- **QrLinkki.Api**  
  Camada de apresentação para expor rotas HTTP (controllers da API REST).
- **QrLinkki.Application**  
  Lógica de aplicação, orquestração dos casos de uso principais.
- **QrLinkki.Domain**  
  Entidades, regras de negócio e interfaces do domínio (DDD).
- **QrLinkki.Infrastructure**  
  Persistência de dados, acesso a serviços externos, storage, migrações.

## Funcionalidades atuais

- Gerar QR Codes a partir de URLs ou textos
- Persistência e consulta dos QR Codes gerados
- Encaminhamento transparente para links associados aos QR Codes
- Regras de validade, expiração e ativação de links encurtados
- Cadastro, consulta, atualização e remoção de usuários
- Verificação de existência de usuário por e-mail
- Criação, atualização/remoção de links seguros e associados ao usuário
- Geração automática de códigos curtos (shortcode) para URLs e sua URL encurtada completa
- Recuperação de todos os links do usuário autenticado
- Registro de cliques em links, incluindo IP e device de acesso
- Suporte à autenticação JWT (JSON Web Token)
- Migração automatizada do banco de dados para criação/manutenção de tabelas
- Consultas por email ou ID, DTOs, mapeamento entre entidades e responses seguras
- Endpoints RESTful para todas entidades principais (Users, Links)
- Documentação automática de endpoints via Swagger

## Como rodar

```
dotnet restore
dotnet build
dotnet run --project QrLinkki.Api --urls="http://localhost:5000"
```
A aplicação irá expor a API localmente (tipicamente em `http://localhost:5000`).

## Exemplo de endpoints

- `POST /api/users` — Cadastro de novo usuário
- `GET /api/users/{user_id}` — Busca de usuário por ID
- `GET /api/users` — Lista de usuários (autenticado)
- `POST /api/links` — Criação de link encurtado com QR Code
- `GET /api/links/{code}` — Consulta pelas informações do link usando o código curto
- `DELETE /api/links/{code}` — Remoção de link

## Contribuição

1. Forke o repositório
2. Crie sua branch (`git checkout -b feature/nome`)
3. Realize suas modificações
4. Abra um Pull Request

## Frontend (Expo) — descrição e tecnologias

O frontend foi construído com Expo (React Native para Web) e TypeScript que fornece a interface de usuário para criação, gerenciamento e visualização de links encurtados e QR Codes. Foi projetado para ser cross-platform (web e mobile), com foco em acessibilidade visual, usabilidade em dispositivos de toque e integração com a API backend via REST + JWT.

Estrutura do frontend (visão geral):

- `QrLinkki.Web/app/` — rotas/páginas principais (login, registro, dashboard, links, criação/edição de links, detalhes públicos).
- `QrLinkki.Web/components/` — componentes reutilizáveis de UI (headers, cards, botões, ícones).
- `QrLinkki.Web/constants/` — tokens de tema e configurações visuais (cores, espaçamentos).
- `QrLinkki.Web/lib/` — utilitários e wrappers (API client, storage, helpers).
- `QrLinkki.Web/hooks/` — hooks personalizados para estado e efeitos compartilhados.
- `QrLinkki.Web/assets/` — imagens e ícones utilizados pela interface.

Principais tecnologias e decisões:

- Expo + expo-router para navegação e publicação multiplataforma.
- TypeScript para segurança de tipos em tempo de desenvolvimento.
- Theming e componentes compartilhados para manter consistência visual entre telas.
- Uso de toasts e feedbacks visuais para ações como copiar para a área de transferência.
- Estratégia de cabeçalho híbrida: cabeçalho nativo estilizado globalmente, com telas específicas em full-bleed quando necessário para fidelidade visual.

Funcionalidades do frontend (resumo):

- Autenticação (login/register) com restauração de token local (`qrlinkki_token`) e tratamento global de respostas 401 para logout/redirect.
- Painel do usuário (dashboard) com listagem de links, ações rápidas (copiar, abrir, editar, deletar) e visual compacto das URLs.
- Criação/edição de links com UI adaptada para mobile (inputs legíveis e botões full-width).
- Página de detalhe de link (acesso controlado pelo proprietário) com QR responsivo, destaque do código e ações de usuário com feedback.
- Cross-platform: atenção a estilos e propriedades compatíveis entre web e mobile; fallback para clipboard nativo quando necessário.

Observação: o texto e o código do backend permaneceram inalterados — o README mantém a seção de backend exatamente como estava.

## Créditos

- Frontend desenvolvido por: Wpnnt (https://github.com/Wpnnt). O frontend inclui a interface web/mobile (Expo) com dashboard, criação/edição de links, geração de QR e integração JWT com o backend.

## Notas de segurança e comportamento importante

- Propriedade dos links: operações sensíveis (GET/PUT/DELETE em `/api/links/{code}` e ações de gerenciamento no painel) exigem autenticação e são verificadas no servidor para garantir que apenas o proprietário do link possa visualizar/editar/deletar.
- Endpoints de usuário (GET/PUT/DELETE `/api/users/{user_id}`) também exigem autenticação e são validados para que apenas o próprio usuário possa alterar ou remover sua conta.
- O endpoint público de redirecionamento curto `/r/{code}` permanece público por design — cada acesso público a esse caminho incrementa o contador de cliques. Se deseja que os shortlinks sejam privados, é necessário alterar esse comportamento (impacto: shortlinks/QR deixarão de funcionar publicamente).
- O frontend lida com respostas 401/403: 401 dispara limpeza de sessão/redirect para login; 403 apresenta mensagem de acesso negado e redireciona ou oculta ações conforme apropriado.

## Como rodar o frontend (Expo)

Pré-requisitos rápidos:

- Node.js (recomenda-se 16+ ou 18+)
- npm ou yarn
- (Opcional) Expo Go no celular para testar em dispositivo físico

Passos (PowerShell / Windows):

```powershell
# vá para a pasta do frontend
cd QrLinkki.Web

# instale dependências
npm install

# iniciar em modo web
npm run web

# ou iniciar o dev server (abre o Metro/DevTools - escolhe web/android/ios)
npm start

# abrir diretamente no Android (se configurado)
npm run android

# abrir no iOS (apenas em macOS)
npm run ios
```

Notas:

- `npm start` abre a interface do Expo (dev tools). A partir dela você pode escolher rodar para web, Android ou iOS.
- Se preferir yarn: use `yarn` e `yarn web` / `yarn start`.
- Certifique-se de que a API backend esteja rodando (por padrão em `http://localhost:5000`) para que o frontend consiga autenticar e consumir os endpoints.

Problemas comuns:

- Caso não consiga conectar ao backend, verifique se a API está em execução e se não há bloqueios de CORS/porta.
- Em dispositivos móveis, ao usar Expo Go, assegure-se que o computador e o celular estejam na mesma rede.


## Licença

[MIT](LICENSE)