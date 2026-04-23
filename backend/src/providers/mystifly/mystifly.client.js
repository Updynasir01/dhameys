const axios = require('axios');

class MystiflyClient {
  constructor(opts = {}) {
    this.baseURL = opts.baseURL || process.env.MYSTIFLY_BASE_URL;
    if (!this.baseURL) {
      throw Object.assign(new Error('Mystifly is not configured (missing MYSTIFLY_BASE_URL)'), { status: 500 });
    }

    this.timeoutMs = parseInt(opts.timeoutMs || process.env.MYSTIFLY_TIMEOUT_MS || '20000', 10);

    this.http = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });

    // Many Mystifly integrations use API key / client id + shared secret.
    // Exact header names depend on the product (REST vs SOAP gateway). We'll keep this pluggable.
    this.auth = {
      apiKey: opts.apiKey || process.env.MYSTIFLY_API_KEY,
      clientId: opts.clientId || process.env.MYSTIFLY_CLIENT_ID,
      clientSecret: opts.clientSecret || process.env.MYSTIFLY_CLIENT_SECRET,
    };
  }

  _authHeaders() {
    const h = {};
    if (this.auth.apiKey) h['x-api-key'] = this.auth.apiKey;
    if (this.auth.clientId) h['x-client-id'] = this.auth.clientId;
    if (this.auth.clientSecret) h['x-client-secret'] = this.auth.clientSecret;
    return h;
  }

  async post(path, body, config = {}) {
    const headers = { ...(config.headers || {}), ...this._authHeaders() };
    return this.http.post(path, body, { ...config, headers });
  }

  async get(path, config = {}) {
    const headers = { ...(config.headers || {}), ...this._authHeaders() };
    return this.http.get(path, { ...config, headers });
  }

  // These are intentionally thin wrappers. Paths/payloads will be finalized once Mystifly shares docs.
  async searchFlights(payload) {
    const route = process.env.MYSTIFLY_SEARCH_PATH || '/flights/search';
    const { data } = await this.post(route, payload);
    return data;
  }

  async fetchFareRules(payload) {
    const route = process.env.MYSTIFLY_FARE_RULES_PATH || '/flights/fare-rules';
    const { data } = await this.post(route, payload);
    return data;
  }

  async createBooking(payload) {
    const route = process.env.MYSTIFLY_BOOKING_PATH || '/bookings/create';
    const { data } = await this.post(route, payload);
    return data;
  }
}

module.exports = MystiflyClient;

