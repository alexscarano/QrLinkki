export function isValidUrl(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export default isValidUrl;
