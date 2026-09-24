const API_BASE = '/api';

export async function fetchForms() {
  const res = await fetch(`${API_BASE}/forms`);
  if (!res.ok) throw new Error('Failed to load forms');
  return res.json();
}

export async function fetchForm(id) {
  const res = await fetch(`${API_BASE}/forms/${id}`);
  if (!res.ok) throw new Error('Form not found');
  return res.json();
}

export async function createForm(formData) {
  const res = await fetch(`${API_BASE}/forms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  if (!res.ok) throw new Error('Failed to create form');
  return res.json();
}

export async function updateForm(id, formData) {
  const res = await fetch(`${API_BASE}/forms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  if (!res.ok) throw new Error('Failed to update form');
  return res.json();
}

export async function deleteForm(id) {
  const res = await fetch(`${API_BASE}/forms/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete form');
  return res.json();
}

export async function duplicateForm(id) {
  const res = await fetch(`${API_BASE}/forms/${id}/duplicate`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to duplicate form');
  return res.json();
}

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
  const res = await fetch(`${API_BASE}/forms/${formId}/responses`);
  if (!res.ok) throw new Error('Failed to fetch responses');
  return res.json();
}

export async function fetchAnalytics(formId) {
  const res = await fetch(`${API_BASE}/forms/${formId}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function transcribeAudio({ audioBase64, mimeType, questionTitle, questionDescription, fieldType, existingText, apiKey, recognizedText }) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['x-gemini-api-key'] = apiKey;
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
    headers: { 'Content-Type': 'application/json' },
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
