const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

// --- AUTH TOKEN & USER STATE HELPERS ---

export function getAuthToken() {
  return localStorage.getItem('voxform_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('voxform_token', token);
  } else {
    localStorage.removeItem('voxform_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('voxform_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('voxform_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('voxform_user');
  }
}

export function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// --- AUTH API METHODS ---

export async function registerUser({ name, email, password }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  if (data.token) setAuthToken(data.token);
  if (data.user) setStoredUser(data.user);
  return data;
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  if (data.token) setAuthToken(data.token);
  if (data.user) setStoredUser(data.user);
  return data;
}

export async function googleLogin({ credential, userInfo }) {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, userInfo })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Google authentication failed');
  if (data.token) setAuthToken(data.token);
  if (data.user) setStoredUser(data.user);
  return data;
}

export async function demoLogin() {
  const res = await fetch(`${API_BASE}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Demo login failed');
  if (data.token) setAuthToken(data.token);
  if (data.user) setStoredUser(data.user);
  return data;
}

export async function getCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) {
      setAuthToken(null);
      setStoredUser(null);
      return null;
    }
    const data = await res.json();
    if (data.user) setStoredUser(data.user);
    return data.user;
  } catch {
    return getStoredUser();
  }
}

export async function getAuthConfig() {
  try {
    const res = await fetch(`${API_BASE}/auth/config`);
    if (!res.ok) return { googleClientId: '', hasGoogleClientId: false };
    return res.json();
  } catch {
    return { googleClientId: '', hasGoogleClientId: false };
  }
}

export async function updateAuthConfig({ googleClientId }) {
  const res = await fetch(`${API_BASE}/auth/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ googleClientId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update auth config');
  return data;
}

export function logoutUser() {
  setAuthToken(null);
  setStoredUser(null);
}

// --- FORMS CRUD API ---

export async function fetchForms(creatorId) {
  const url = creatorId ? `${API_BASE}/forms?creatorId=${encodeURIComponent(creatorId)}` : `${API_BASE}/forms`;
  const res = await fetch(url, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Failed to load forms');
  return res.json();
}

export async function fetchForm(id) {
  const res = await fetch(`${API_BASE}/forms/${id}`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Form not found');
  return res.json();
}

export async function createForm(formData = {}) {
  const res = await fetch(`${API_BASE}/forms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(formData || {})
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create form');
  }
  return res.json();
}

export async function updateForm(id, formData) {
  const res = await fetch(`${API_BASE}/forms/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(formData)
  });
  if (!res.ok) throw new Error('Failed to update form');
  return res.json();
}

export async function deleteForm(id) {
  const res = await fetch(`${API_BASE}/forms/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Failed to delete form');
  return res.json();
}

export async function duplicateForm(id) {
  const res = await fetch(`${API_BASE}/forms/${id}/duplicate`, {
    method: 'POST',
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Failed to duplicate form');
  return res.json();
}

// --- RESPONSES & ANALYTICS API ---

export async function submitResponse(formId, responseData) {
  const res = await fetch(`${API_BASE}/forms/${formId}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(responseData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit response');
  }
  return data;
}

export async function fetchResponses(formId) {
  const res = await fetch(`${API_BASE}/forms/${formId}/responses`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Failed to fetch responses');
  return res.json();
}

export async function fetchAnalytics(formId) {
  const res = await fetch(`${API_BASE}/forms/${formId}/analytics`, {
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

// --- TRANSCRIBE & AI AUDIO API ---

export async function transcribeAudio({ audioBase64, mimeType, questionTitle, questionDescription, fieldType, existingText, apiKey, recognizedText }) {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
  if (apiKey) {
    headers['x-voice-ai-key'] = apiKey;
  }

  const res = await fetch(`${API_BASE}/transcribe`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      audioBase64,
      mimeType,
      questionTitle,
      questionDescription,
      fieldType,
      existingText,
      apiKey,
      recognizedText
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Speech transcription failed');
  }
  return data;
}

export async function getTranscribeStatus() {
  const res = await fetch(`${API_BASE}/transcribe/status`);
  if (!res.ok) return { configured: false };
  return res.json();
}

export async function setServerApiKey(apiKey) {
  const res = await fetch(`${API_BASE}/transcribe/set-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ apiKey })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to set API key');
  return data;
}

export function getExportCsvUrl(formId) {
  return `${API_BASE}/forms/${formId}/export/csv`;
}

export function getExportJsonUrl(formId) {
  return `${API_BASE}/forms/${formId}/export/json`;
}

// Upload document attachment
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/forms/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to upload document');
  }
  return data;
}

