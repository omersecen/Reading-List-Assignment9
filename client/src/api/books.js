const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

async function request(path, { method = 'GET', body, signal } = {}) {
  if (!baseUrl) throw new Error('Set VITE_API_URL in client/.env and restart Vite');

  const options = { method, signal };
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}/api${path}`, options);
  if (!response.ok) {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;
    throw new Error(data?.error || `The API returned HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined;
  return response.json();
}

export function listBooks(filters, signal) {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (value !== '' && value !== undefined) query.set(name, value);
  }
  const search = query.toString();
  return request(search ? `/books?${search}` : '/books', { signal });
}

export function getStats(signal) {
  return request('/stats', { signal });
}

export function createBook(body) {
  return request('/books', { method: 'POST', body });
}

export function replaceBook(id, body) {
  return request(`/books/${id}`, { method: 'PUT', body });
}

export function updateBook(id, body) {
  return request(`/books/${id}`, { method: 'PATCH', body });
}

export function deleteBook(id) {
  return request(`/books/${id}`, { method: 'DELETE' });
}
