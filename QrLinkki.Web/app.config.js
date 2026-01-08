// Load .env when available to support local development via API_URL
try {
  // optional dependency; if not installed, ignore silently
  // (CI/build systems can set env vars directly)
  require('dotenv').config();
} catch (e) {
  // ignore if dotenv is not available
}

module.exports = ({ config }) => {
  // API_URL padrão para desenvolvimento (Android Emulator)
  // Desenvolvedores podem sobrescrever criando arquivo .env com API_URL=seu_ip
  const defaultApiUrl = 'http://10.0.2.2:5000';

  const apiUrl = process.env.API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.REACT_APP_API_URL ||
    defaultApiUrl;

  if (!apiUrl && process.env.NODE_ENV === 'production') {
    throw new Error('Missing API_URL environment variable for production build.');
  }

  // Detecta se é build de staging
  const isStaging = process.env.BUILD_ENV === 'staging' || process.env.EXPO_PUBLIC_BUILD_ENV === 'staging';
  
  // Para staging: modifica nome do app e package para permitir instalação lado a lado
  const appName = isStaging ? 'QrLinkki (Staging)' : config.name;
  const packageName = isStaging ? 'com.warph.qrlinkkiweb.staging' : (config.android?.package || 'com.warph.qrlinkkiweb');

  return {
    ...config,
    name: appName,
    // Ensure android package is explicitly set so `expo prebuild` and
    // native generation use the correct application id consistently.
    android: {
      ...(config.android || {}),
      package: packageName,
    },
    extra: {
      ...(config.extra || {}),
      apiUrl,
      buildEnv: isStaging ? 'staging' : 'production',
    },
  };
};
