// API client compartido entre web y mobile
// En web se usa fetch nativo, en mobile también (React Native lo soporta)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const apiClient = {
  pacientes: {
    list: () => apiFetch("/api/pacientes"),
    get: (id: string) => apiFetch(`/api/pacientes/${id}`),
    create: (data: unknown) => apiFetch("/api/pacientes", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch(`/api/pacientes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/pacientes/${id}`, { method: "DELETE" }),
  },
  turnos: {
    list: () => apiFetch("/api/turnos"),
    get: (id: string) => apiFetch(`/api/turnos/${id}`),
    create: (data: unknown) => apiFetch("/api/turnos", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch(`/api/turnos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/turnos/${id}`, { method: "DELETE" }),
  },
  plantillas: {
    list: () => apiFetch("/api/plantillas"),
    get: (id: string) => apiFetch(`/api/plantillas/${id}`),
    create: (data: unknown) => apiFetch("/api/plantillas", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch(`/api/plantillas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/plantillas/${id}`, { method: "DELETE" }),
  },
};
