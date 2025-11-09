# Etapa 1: build da aplicação
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copiar os arquivos da solution e restaurar dependências
COPY *.sln ./
COPY QrLinkki.Domain/*.csproj ./QrLinkki.Domain/
COPY QrLinkki.Application/*.csproj ./QrLinkki.Application/
COPY QrLinkki.Infrastructure/*.csproj ./QrLinkki.Infrastructure/
COPY QrLinkki.Api/*.csproj ./QrLinkki.Api/

RUN dotnet restore QrLinkki.Api/QrLinkki.Api.csproj

# Copiar o código-fonte
COPY . ./

# Fazer o build e publicar
RUN dotnet publish QrLinkki.Api/QrLinkki.Api.csproj -c Release -o /out

# Etapa 2: imagem de execução
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /out .

# Variável de ambiente para usar a porta padrão do SquareCloud
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Copia o banco SQLite
COPY QrLinkki.Infrastructure/Persistence/Database/qr_linkki.db /app/Database/qr_linkki.db

# Iniciar o app
ENTRYPOINT ["dotnet", "QrLinkki.Api.dll"]
