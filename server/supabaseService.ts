import { getSupabaseClient } from "./supabase";

export type DbPaymentStatus = "PENDING" | "PAID" | "REFUSED" | "CANCELED";

export interface DbPayment {
  id: string;
  name: string;
  email: string;
  cpf_cnpj: string;
  phone?: string;
  amount: number;
  status: DbPaymentStatus;
  method: "pix" | "card";
  is_simulated: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function createPaymentRecord(input: {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  amount: number;
  method: "pix" | "card";
  isSimulated: boolean;
  metadata?: Record<string, any>;
}) {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("payments")
    .insert({
      id: input.id,
      name: input.name,
      email: input.email,
      cpf_cnpj: input.cpfCnpj,
      phone: input.phone || null,
      amount: input.amount,
      status: "PENDING",
      method: input.method,
      is_simulated: input.isSimulated,
      metadata: input.metadata || {},
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar pagamento no Supabase: ${error.message}`);
  }

  return data as DbPayment;
}

export async function getPaymentById(id: string): Promise<DbPayment | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data as DbPayment;
}

export async function getPaymentByEmail(email: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as DbPayment;
}

export async function listPaidPaymentsByEmail(email: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("email", email)
    .eq("status", "PAID")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data as DbPayment[];
}

export async function updatePaymentStatus(id: string, status: DbPaymentStatus) {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("payments")
    .update({ status, updated_at: now })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar pagamento no Supabase: ${error.message}`);
  }

  return data as DbPayment;
}

export async function updatePaymentMetadata(id: string, metadata: Record<string, any>) {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("payments")
    .update({ metadata, updated_at: now })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar metadata no Supabase: ${error.message}`);
  }

  return data as DbPayment;
}

export async function cancelPayment(id: string): Promise<DbPayment> {
  return updatePaymentStatus(id, "CANCELED");
}

export async function confirmPayment(id: string): Promise<DbPayment> {
  return updatePaymentStatus(id, "PAID");
}

export async function refusePayment(id: string): Promise<DbPayment> {
  return updatePaymentStatus(id, "REFUSED");
}

export async function listPendingPayments(limit = 100) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Erro ao listar pagamentos pendentes: ${error.message}`);
  }

  return data as DbPayment[];
}

export async function getPaymentByOrderId(orderId: string): Promise<DbPayment | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as DbPayment;
}

export async function hasPaidPaymentByEmail(email: string): Promise<boolean> {
  const payments = await listPaidPaymentsByEmail(email);
  return payments.length > 0;
}

export async function countPaymentsByStatus(status: DbPaymentStatus): Promise<number> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("status", status);

  if (error) {
    throw new Error(`Erro ao contar pagamentos: ${error.message}`);
  }

  return count || 0;
}

export async function deletePayment(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao remover pagamento: ${error.message}`);
  }
}

export async function ensureSupabasePaymentRecord(input: {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  amount: number;
  method: "pix" | "card";
  isSimulated: boolean;
  metadata?: Record<string, any>;
}) {
  const existing = await getPaymentById(input.id);

  if (existing) {
    return existing;
  }

  return createPaymentRecord(input);
}

