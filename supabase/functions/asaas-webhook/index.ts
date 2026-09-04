import { json } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase.ts";

const paidEvents = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const refusedEvents = new Set(["PAYMENT_OVERDUE", "PAYMENT_DELETED", "PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED"]);

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Método não permitido" }, 405);
  const expectedToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  const receivedToken = request.headers.get("asaas-access-token") || request.headers.get("x-asaas-token");
  if (!expectedToken || receivedToken !== expectedToken) return json({ error: "Não autorizado" }, 401);

  try {
    const payload = await request.json();
    const eventId = payload.id;
    const event = payload.event;
    const asaasPaymentId = payload.payment?.id;
    if (typeof eventId !== "string" || typeof event !== "string" || typeof asaasPaymentId !== "string") return json({ error: "Webhook inválido" }, 400);

    const admin = getAdminClient();
    const { error: eventError } = await admin.from("asaas_webhook_events").insert({ event_id: eventId, event, payment_id: asaasPaymentId, payload });
    if (eventError?.code === "23505") return json({ received: true, duplicate: true });
    if (eventError) throw eventError;

    const status = paidEvents.has(event) ? "PAID" : refusedEvents.has(event) ? "REFUSED" : null;
    if (status) {
      await admin.from("payments").update({ status, updated_at: new Date().toISOString(), metadata: { asaasEvent: event } }).eq("asaas_payment_id", asaasPaymentId);
    }
    return json({ received: true });
  } catch (error) {
    console.error("asaas-webhook:", error);
    return json({ error: "Falha ao processar webhook" }, 500);
  }
});