function getActiveFlightProviderKey() {
  return String(process.env.FLIGHT_PROVIDER || 'mongo').toLowerCase();
}

function isMystiflyEnabled() {
  const key = getActiveFlightProviderKey();
  if (key !== 'mystifly') return false;
  // Require at least a base URL to avoid silently breaking production.
  return Boolean(process.env.MYSTIFLY_BASE_URL);
}

module.exports = { getActiveFlightProviderKey, isMystiflyEnabled };

