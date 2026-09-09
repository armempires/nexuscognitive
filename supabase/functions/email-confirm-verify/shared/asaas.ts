const asaasEnvironment = Deno.env.get("ASAAS_ENVIRONMENT") === "production" ? "production" : "sandbox";
const asaasUrl = Deno.env.get("ASAAS_API_URL") || (asaasEnvironment === "production"
  ? "https://api.asaas.com/v3"
  : "https://api-sandbox.asaas.com/v3");

function getHeaders() {
  const apiKey = Deno.env.get("ASAAS_API_KEY");
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurada");
  return { access_token: apiKey, "Content-Type": "application/json" };
}

export async function asaasRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${asaasUrl}${path}`, {
    ...init,
    headers: { ...getHeaders(), ...(init.headers || {}) },
  });
  const responseText = await response.text();
  let body: Record<string, unknown> = {};
  try {
    body = responseText ? JSON.parse(responseText) : {};
  } catch {
    const preview = responseText.replace(/\s+/g, " ").slice(0, 120);
    throw new Error(`Resposta inválida do Asaas em ${path} (HTTP ${response.status}, ${response.headers.get("content-type") || "sem content-type"}): ${preview}`);
  }
  if (!response.ok) {
    const message = body?.errors?.[0]?.description || "Erro na API do Asaas";
    throw new Error(message);
  }
  if (!Object.keys(body).length) {
    throw new Error(`Resposta vazia do Asaas (HTTP ${response.status}). Verifique ASAAS_API_KEY, ASAAS_ENVIRONMENT e ASAAS_API_URL.`);
  }
  return body;
}

export async function findOrCreateCustomer(input: { name: string; email: string; cpfCnpj: string; phone?: string }) {
  const cpfCnpj = input.cpfCnpj.replace(/\D/g, "");
  const query = await asaasRequest(`/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}&limit=1`);
  if (query.data?.[0]?.id) return query.data[0].id as string;

  const customer = await asaasRequest("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      cpfCnpj,
      mobilePhone: input.phone?.replace(/\D/g, "") || undefined,
      notificationDisabled: true,
    }),
  });
  return customer.id as string;
}

export function isPaidStatus(status: string) {
  return status === "CONFIRMED" || status === "RECEIVED";
}