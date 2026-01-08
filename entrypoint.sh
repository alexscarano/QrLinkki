#!/bin/sh
set -e

echo "Starting QrLinkki API..."
exec dotnet QrLinkki.Api.dll
