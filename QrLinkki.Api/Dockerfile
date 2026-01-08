FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["QrLinkki.Api/QrLinkki.Api.csproj", "QrLinkki.Api/"]
COPY ["QrLinkki.Application/QrLinkki.Application.csproj", "QrLinkki.Application/"]
COPY ["QrLinkki.Domain/QrLinkki.Domain.csproj", "QrLinkki.Domain/"]
COPY ["QrLinkki.Infrastructure/QrLinkki.Infrastructure.csproj", "QrLinkki.Infrastructure/"]

RUN dotnet restore "QrLinkki.Api/QrLinkki.Api.csproj"

# Copy everything else and publish
COPY . .
WORKDIR /src/QrLinkki.Api
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
COPY entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
