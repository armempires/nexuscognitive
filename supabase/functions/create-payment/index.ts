import { corsHeaders, handleOptions, json } from "../_shared/cors.ts";
import { asaasRequest, findOrCreateCustomer, isPaidStatus } from "../_shared/asaas.ts";
import { getAdminClient } from "../_shared/supabase.ts";

const SERVICE_CODE = "qi-report";

function validEmail(value: unknown) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const body = await request.json();
    const method = body.method === "card" ? "card" : body.method === "pix" ? "pix" : null;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const cpfCnpj = typeof body.cpfCnpj === "string" ? body.cpfCnpj : "";
    if (!method || name.length < 3 || !validEmail(email) || cpfCnpj.replace(/\D/g, "").length < 11) {
      return json({ error: "Dados do pagador inválidos" }, 400);
    }

    const admin = getAdminClient();
    const { data: service, error: serviceError } = await admin
      .from("service_prices")
      .select("code,description,amount,currency")
      .eq("code", SERVICE_CODE)
      .eq("active", true)
      .maybeSingle();
    if (serviceError || !service) throw new Error("Serviço sem preço ativo configurado no Supabase");
    const amount = Number(service.amount);
    if (!Number.isFinite(amount) || amount <= 0 || service.currency !== "BRL") {
      throw new Error("Preço do serviço inválido no Supabase");
    }

    const orderId = crypto.randomUUID();
    const customerId = await findOrCreateCustomer({ name, email, cpfCnpj, phone: body.phone });
    const paymentBody: Record<string, unknown> = {
      customer: customerId,
      billingType: method === "pix" ? "PIX" : "CREDIT_CARD",
      value: amount,
      dueDate: new Date().toISOString().slice(0, 10),
      description: service.description,
      externalReference: orderId,
    };

    if (method === "card") {
      const card = body.card;
      if (!card || typeof card !== "object") return json({ error: "Dados do cartão ausentes" }, 400);
      paymentBody.creditCard = {
        holderName: String(card.holderName || "").toUpperCase(),
        number: String(card.number || "").replace(/\D/g, ""),
        expiryMonth: String(card.expiryMonth || "").padStart(2, "0"),
        expiryYear: String(card.expiryYear || "").length === 2 ? `20${card.expiryYear}` : String(card.expiryYear || ""),
        ccv: String(card.ccv || ""),
      };
      paymentBody.creditCardHolderInfo = {
        name,
        email,
        cpfCnpj: cpfCnpj.replace(/\D/g, ""),
        postalCode: String(body.postalCode || "").replace(/\D/g, ""),
        addressNumber: String(body.addressNumber || ""),
        mobilePhone: String(body.phone || "").replace(/\D/g, ""),
      };
    }

    const payment = await asaasRequest("/payments", { method: "POST", body: JSON.stringify(paymentBody) });
    if (!payment?.id) throw new Error("O Asaas não retornou o ID da cobrança. Verifique ASAAS_API_KEY e ASAAS_ENVIRONMENT nos secrets.");
    const status = String(payment.status || "PENDING");
    const refusalReason = typeof payment.lastTransactionError === "string"
      ? payment.lastTransactionError
      : (payment.transactionReceiptUrl && payment.status !== "CONFIRMED" && payment.status !== "RECEIVED"
          ? "Cartão recusado pela operadora."
          : null);
    const { error: insertError } = await admin.from("payments").insert({
      id: orderId,
      asaas_payment_id: payment.id,
      name,
      email,
      cpf_cnpj: cpfCnpj.replace(/\D/g, ""),
      phone: body.phone || null,
      amount,
      method,
      status: isPaidStatus(status) ? "PAID" : (status === "REFUSED" || status === "REJECTED" || status === "FAILED" ? "REFUSED" : "PENDING"),
      metadata: { customerId, asaasStatus: status, refusalReason, serviceCode: SERVICE_CODE },
    });
    if (insertError) throw new Error(`Não foi possível registrar o pedido: ${insertError.message}`);

    if (method === "pix") {
      const qr = await asaasRequest(`/payments/${payment.id}/pixQrCode`);
      return json({ orderId, paymentId: payment.id, status, qrCodeImage: qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : undefined, payload: qr.payload, expirationDate: qr.expirationDate });
    }

    if (status === "REFUSED" || status === "REJECTED" || status === "FAILED" || status === "REFUNDED") {
      return json({
        orderId,
        paymentId: payment.id,
        status,
        isConfirmed: false,
        refused: true,
        refusalReason: refusalReason || "Pagamento recusado pela operadora do cartão.",
      }, 402);
    }

    return json({ orderId, paymentId: payment.id, status, isConfirmed: isPaidStatus(status) });
  } catch (error) {
    console.error("create-payment:", error);
    return json({ error: error instanceof Error ? error.message : "Não foi possível criar o pagamento" }, 400);
  }
});