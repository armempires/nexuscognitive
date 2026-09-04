import { corsHeaders, handleOptions, json } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase.ts";
import { asaasRequest, isPaidStatus } from "../_shared/asaas.ts";

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, asaasPaymentId } = body;

    const admin = getAdminClient();

    let order = null;
    if (orderId) {
      const { data } = await admin.from("payments").select("*").eq("id", orderId).maybeSingle();
      order = data;
    } else if (asaasPaymentId) {
      const { data } = await admin.from("payments").select("*").eq("asaas_payment_id", asaasPaymentId).maybeSingle();
      order = data;
    } else {
      return json({ error: "orderId ou asaasPaymentId obrigatório" }, 400);
    }

    if (!order) return json({ error: "Pedido não encontrado" }, 404);
    if (!order.asaas_payment_id) return json({ error: "Pedido sem asaas_payment_id" }, 400);
    if (order.status === "PAID") {
      return json({ orderId: order.id, status: order.status, isConfirmed: true, alreadyPaid: true });
    }

    const asaas = await asaasRequest(`/payments/${order.asaas_payment_id}`);
    const asaasStatus = String(asaas.status || "PENDING");
    const paid = isPaidStatus(asaasStatus);

    if (paid) {
      const { data: updated } = await admin
        .from("payments")
        .update({ status: "PAID", updated_at: new Date().toISOString(), metadata: { ...(order.metadata || {}), asaasEvent: `RECONCILED_${asaasStatus}` } })
        .eq("id", order.id)
        .select()
        .single();
      return json({ orderId: order.id, status: "PAID", isConfirmed: true, asaasStatus, reconciled: true });
    }

    return json({ orderId: order.id, status: order.status, isConfirmed: false, asaasStatus });
  } catch (error) {
    console.error("force-confirm-payment:", error);
    return json({ error: error instanceof Error ? error.message : "Erro ao reconciliar" }, 400);
  }
});
