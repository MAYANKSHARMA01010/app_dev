import { Platform } from 'react-native';

// Primary choice: 10.7 LAN IP (from root .env or default fallback)
export const PRIMARY_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.7.1.51:3000';

// Secondary choice: Docker container / localhost fallback
export const DOCKER_URL = process.env.EXPO_PUBLIC_API_URL_DOCKER || (
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000'
);

// Fallback candidates in strict priority order (10.7 first, then Docker/localhost)
export const CANDIDATE_URLS = [
  PRIMARY_URL,
  DOCKER_URL,
  ...(Platform.OS === 'android' && DOCKER_URL !== 'http://10.0.2.2:3000' ? ['http://10.0.2.2:3000'] : []),
].filter((url, index, self) => Boolean(url) && self.indexOf(url) === index);

let activeBaseUrl = PRIMARY_URL;

export const getBaseUrl = () => activeBaseUrl;
export const BASE_URL = PRIMARY_URL; // For backward compatibility

const getHeaders = (credentials) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (credentials?.username && credentials?.password) {
    // Backend expects literal "Authorization: Basic <username>:<password>"
    headers['Authorization'] = `Basic ${credentials.username}:${credentials.password}`;
  }
  return headers;
};

/**
 * Executes an API request trying the primary 10.7 URL first,
 * and falling back to Docker/localhost if unreachable.
 */
async function request(endpoint, options = {}, credentials = null) {
  const headers = getHeaders(credentials);
  const fetchOptions = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  };

  // Candidates with activeBaseUrl first, but PRIMARY_URL is prioritized
  const candidates = [
    activeBaseUrl,
    ...CANDIDATE_URLS.filter((u) => u !== activeBaseUrl),
  ];

  let lastError = null;

  for (let i = 0; i < candidates.length; i++) {
    const base = candidates[i];
    const fullUrl = `${base}${endpoint}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(fullUrl, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Server responded (even with 4xx/5xx) -> host is alive
      activeBaseUrl = base;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }
      return data;
    } catch (err) {
      // If it's a server response error (not a connection/network abort error), do not try next candidate
      const isNetworkError =
        err.name === 'AbortError' ||
        err.message?.toLowerCase().includes('network request failed') ||
        err.message?.toLowerCase().includes('aborted') ||
        err.message?.toLowerCase().includes('failed to fetch');

      if (!isNetworkError) {
        throw err;
      }

      lastError = err;
      console.warn(`[API] Host ${base} unreachable. Trying next candidate...`);
    }
  }

  throw new Error(
    lastError?.message || `Failed to connect to backend (tried ${candidates.join(', ')})`
  );
}

export const api = {
  getBaseUrl,

  async getProfile(credentials, userId) {
    const endpoint = userId
      ? `/user/profile?user_id=${encodeURIComponent(userId)}`
      : `/user/profile`;
    return request(endpoint, { method: 'GET' }, credentials);
  },

  async login(username, password) {
    return this.getProfile({ username, password });
  },

  async getAllUsers(credentials) {
    return request('/user', { method: 'GET' }, credentials);
  },

  async getConversations(credentials) {
    return request('/conversation', { method: 'GET' }, credentials);
  },

  async createConversation(credentials, { type = 'DM', name, participants_ids }) {
    const body = { type, participants_ids };
    if (name) body.name = name;
    return request('/conversation', {
      method: 'POST',
      body: JSON.stringify(body),
    }, credentials);
  },

  async getMessages(credentials, conversationId, cursor) {
    let endpoint = `/message?conversation_id=${encodeURIComponent(conversationId)}`;
    if (cursor) {
      endpoint += `&from_message_cursor=${encodeURIComponent(cursor)}`;
    }
    return request(endpoint, { method: 'GET' }, credentials);
  },

  /**
   * Send a message with optional text content and/or optional Base64 image
   */
  async sendMessage(credentials, conversationId, content, imageInfo = null) {
    const body = {
      conversation_id: conversationId,
    };
    if (content !== undefined && content !== null) {
      body.content = content;
    }
    if (imageInfo) {
      body.imageInfo = imageInfo;
    }
    return request('/message', {
      method: 'POST',
      body: JSON.stringify(body),
    }, credentials);
  },
};
