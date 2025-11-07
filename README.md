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

## Licença

[MIT](LICENSE)
