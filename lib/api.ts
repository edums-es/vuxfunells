import type { PublicFunnelResponse, FunnelDefinition } from '../types';

export type AdminUser = { id: string; email: string; role: string };

export type AdminLoginResponse = { token: string; user: AdminUser };

export type AdminFunnel = {
  id: string;
  name: string;
  status: 'draft' | 'active';
  version: number;
  createdAt: string;
  updatedAt: string;
  definition: FunnelDefinition;
};

export type AdminLead = {
  id: string;
  visitorId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  firstSeenAt: string;
  lastSeenAt: string;
  convertedAt: string | null;
  lifetimeValueCents?: number;
  tags: string[];
  lastEventAt?: string | null;
  lastStep?: string | null;
  checkoutStartedAt?: string | null;
  purchasesCount?: number;
  totalValueCents?: number;
};

export type AdminEvent = {
  id: string;
  visitorId: string;
  leadId: string | null;
  type: string;
  step: string | null;
  funnelId: string | null;
  payload: unknown;
  ts: string;
};

export type OverviewMetrics = {
  totals: { totalLeads: number; totalConversions: number; conversionRate: number };
  steps: { step: string; count: number }[];
  sales: {
    day: { count: number; valueCents: number };
    week: { count: number; valueCents: number };
    month: { count: number; valueCents: number };
    seriesLast30Days: { day: string; purchases: number; valueCents: number }[];
  };
  checkout: {
    starts: { day: number; week: number; month: number };
    abandonmentRate: { day: number; week: number; month: number };
  };
  offers: { upsellTakeRate: number; offerViews: number; offerAccepts: number };
};

const API_BASE = import.meta.env.VITE_API_URL || 'https://vuxfunells-production.up.railway.app';
console.log('[API] Using Base URL:', API_BASE);

async function requestJson<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  console.log('[API] Fetching:', url);
  const res = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  
  // Check if response is HTML (common error when API URL is wrong and hitting frontend 404)
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    const text = await res.text();
    console.error('[API] Received HTML instead of JSON:', text.substring(0, 500));
    throw new Error('A API retornou HTML em vez de JSON. Verifique a configuração da URL da API (CORS ou URL errada).');
  }

  return (await res.json()) as T;
}

export const adminTokenStorage = {
  get() {
    return localStorage.getItem('admin_token');
  },
  set(token: string) {
    localStorage.setItem('admin_token', token);
  },
  clear() {
    localStorage.removeItem('admin_token');
  }
};

export async function fetchPublicFunnel(): Promise<PublicFunnelResponse> {
  // Add timestamp to prevent caching
  return requestJson<PublicFunnelResponse>(`/api/public/funnel?t=${Date.now()}`);
}

export async function trackEvent(input: {
  visitorId: string;
  type: string;
  step?: string;
  funnelId?: string;
  payload?: unknown;
  ts?: string;
}): Promise<{ ok: true; leadId: string }> {
  return requestJson<{ ok: true; leadId: string }>('/api/public/events', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function upsertLeadContact(input: {
  visitorId: string;
  name?: string;
  email?: string;
  phone?: string;
}): Promise<{ ok: true }> {
  return requestJson<{ ok: true }>('/api/public/leads/contact', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

function adminHeaders() {
  const token = adminTokenStorage.get();
  return token ? { authorization: `Bearer ${token}` } : {};
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  return requestJson<AdminLoginResponse>('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function adminMe(): Promise<AdminUser> {
  return requestJson<AdminUser>('/api/admin/me', { headers: adminHeaders() });
}

export async function adminListFunnels(): Promise<{ funnels: AdminFunnel[] }> {
  return requestJson<{ funnels: AdminFunnel[] }>('/api/admin/funnels', { headers: adminHeaders() });
}

export async function adminGetFunnel(id: string): Promise<{ funnel: AdminFunnel }> {
  return requestJson<{ funnel: AdminFunnel }>(`/api/admin/funnels/${id}`, { headers: adminHeaders() });
}

export async function adminCreateFunnel(name: string, definition?: FunnelDefinition): Promise<{ funnel: AdminFunnel }> {
  return requestJson<{ funnel: AdminFunnel }>('/api/admin/funnels', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ name, definition })
  });
}

export async function adminUpdateFunnel(
  id: string,
  input: Partial<Pick<AdminFunnel, 'name' | 'status' | 'definition'>>
): Promise<{ funnel: AdminFunnel }> {
  return requestJson<{ funnel: AdminFunnel }>(`/api/admin/funnels/${id}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(input)
  });
}

export async function adminDeleteFunnel(id: string): Promise<{ ok: true }> {
  return requestJson<{ ok: true }>(`/api/admin/funnels/${id}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
}

export async function adminListLeads(search?: string): Promise<{ leads: AdminLead[] }> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  return requestJson<{ leads: AdminLead[] }>(`/api/admin/leads?${params.toString()}`, { headers: adminHeaders() });
}

export async function adminLeadDetail(id: string): Promise<{ lead: AdminLead; events: AdminEvent[] }> {
  return requestJson<{ lead: AdminLead; events: AdminEvent[] }>(`/api/admin/leads/${id}`, { headers: adminHeaders() });
}

export async function adminOverviewMetrics(): Promise<OverviewMetrics> {
  return requestJson<OverviewMetrics>('/api/admin/metrics/overview', { headers: adminHeaders() });
}

export async function adminUploadFile(file: File): Promise<{ url: string }> {
  console.log('[Upload] Starting upload for:', file.name, 'Size:', file.size);
  const formData = new FormData();
  formData.append('file', file);
  
  // Do not set Content-Type header, browser does it with boundary
  // BUT we need to remove 'Content-Type' if it was accidentally added by adminHeaders
  const headers = adminHeaders() as Record<string, string>;
  delete headers['Content-Type']; // Important: let browser set boundary

  try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[Upload] Error:', res.status, text);
        throw new Error(text || `HTTP ${res.status}`);
      }
      
      const json = await res.json();
      console.log('[Upload] Success:', json);
      return json;
  } catch (error) {
      console.error('[Upload] Network/Server Error:', error);
      throw error;
  }
}

export type AdminUserFull = {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
};

export async function adminListUsers(): Promise<{ users: AdminUserFull[] }> {
  return requestJson<{ users: AdminUserFull[] }>('/api/admin/users', { headers: adminHeaders() });
}

export async function adminCreateUser(data: { email: string; password: string; role: string }): Promise<{ user: AdminUserFull }> {
  return requestJson<{ user: AdminUserFull }>('/api/admin/users', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(data)
  });
}

export async function adminDeleteUser(id: string): Promise<{ ok: true }> {
  return requestJson<{ ok: true }>(`/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
}

export async function openPixCharge(data: { 
  correlationID: string; 
  value: number; 
  comment?: string; 
  customer?: { name?: string; email?: string; phone?: string; taxID?: string } 
}): Promise<any> {
  // Public or Auth? Using generic requestJson for now.
  // If it's a public checkout, no auth header needed unless we enforce it.
  // But our server implementation doesn't require auth for this endpoint.
  return requestJson('/api/openpix/charge', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function openPixCheckStatus(correlationID: string): Promise<any> {
  return requestJson(`/api/openpix/charge/${correlationID}`);
}

// --- Admin Settings & Integrations ---

export type AdminSettings = {
  emailMarketing?: {
    provider: string;
    apiKey: string;
    fromEmail: string;
  };
  whatsapp?: {
    activeTab: 'waba' | 'evolution';
    waba: { token: string; phoneId: string; wabaId: string };
    evolution: { url: string; apiKey: string; instanceName: string };
  };
};

export type AdminWebhook = {
  id: number;
  url: string;
  event: string;
  active: boolean;
};

export async function adminGetSettings(): Promise<{ settings: AdminSettings }> {
  return requestJson<{ settings: AdminSettings }>('/api/admin/settings', { headers: adminHeaders() });
}

export async function adminUpdateSettings(settings: Partial<AdminSettings>): Promise<{ settings: AdminSettings }> {
  return requestJson<{ settings: AdminSettings }>('/api/admin/settings', {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(settings)
  });
}

export async function adminListWebhooks(): Promise<{ webhooks: AdminWebhook[] }> {
  return requestJson<{ webhooks: AdminWebhook[] }>('/api/admin/webhooks', { headers: adminHeaders() });
}

export async function adminAddWebhook(webhook: Omit<AdminWebhook, 'id'>): Promise<{ webhook: AdminWebhook }> {
  return requestJson<{ webhook: AdminWebhook }>('/api/admin/webhooks', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(webhook)
  });
}

export async function adminDeleteWebhook(id: number): Promise<{ ok: true }> {
  return requestJson<{ ok: true }>(`/api/admin/webhooks/${id}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
}
