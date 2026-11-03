export const BASE_URL = 'http://10.7.1.51:3000';

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

export const api = {
  async getProfile(credentials, userId) {
    const url = userId
      ? `${BASE_URL}/user/profile?user_id=${encodeURIComponent(userId)}`
      : `${BASE_URL}/user/profile`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(credentials),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch profile');
    }
    return data;
  },

  async login(username, password) {
    return this.getProfile({ username, password });
  },

  async getAllUsers(credentials) {
    const res = await fetch(`${BASE_URL}/user`, {
      method: 'GET',
      headers: getHeaders(credentials),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch users');
    }
    return data;
  },

  async getConversations(credentials) {
    const res = await fetch(`${BASE_URL}/conversation`, {
      method: 'GET',
      headers: getHeaders(credentials),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch conversations');
    }
    return data;
  },

  async createConversation(credentials, { type = 'DM', name, participants_ids }) {
    const body = { type, participants_ids };
    if (name) body.name = name;
    const res = await fetch(`${BASE_URL}/conversation`, {
      method: 'POST',
      headers: getHeaders(credentials),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create conversation');
    }
    return data;
  },

  async getMessages(credentials, conversationId, cursor) {
    let url = `${BASE_URL}/message?conversation_id=${encodeURIComponent(conversationId)}`;
    if (cursor) {
      url += `&from_message_cursor=${encodeURIComponent(cursor)}`;
    }
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(credentials),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch messages');
    }
    return data;
  },

  async sendMessage(credentials, conversationId, content) {
    const res = await fetch(`${BASE_URL}/message`, {
      method: 'POST',
      headers: getHeaders(credentials),
      body: JSON.stringify({
        conversation_id: conversationId,
        content,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send message');
    }
    return data;
  },
};

