import { corsHeaders, handleOptions, json } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return json({ error: "Método não permitido" }, 405);
  try {
    const { orderId } = await request.json();
    if (typeof orderId !== "string" || !orderId) return json({ error: "Pedido inválido" }, 400);
    const { data, error } = await getAdminClient().from("payments").select("id,status,amount,method").eq("id", orderId).maybeSingle();
    if (error || !data) return json({ error: "Pedido não encontrado" }, 404);
    return json({ orderId: data.id, status: data.status, isConfirmed: data.status === "PAID", amount: data.amount, method: data.method });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro ao consultar pagamento" }, 400);
  }
});