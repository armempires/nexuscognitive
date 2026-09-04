import { getSupabaseClient } from "./supabase";

export interface SecretRecord {
  key: string;
  value: string;
  updated_at: string;
}

export async function getSecret(key: string): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("app_secrets")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data.value;
  } catch (error) {
    console.error(`Erro ao buscar secret ${key}:`, error);
    return null;
  }
}

export async function getAllSecrets(): Promise<SecretRecord[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("app_secrets")
      .select("*")
      .order("key", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar secrets:", error);
    return [];
  }
}

export async function setSecret(key: string, value: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("app_secrets")
      .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) {
      console.error(`Erro ao salvar secret ${key}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Erro ao salvar secret ${key}:`, error);
    return false;
  }
}

export async function deleteSecret(key: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("app_secrets")
      .delete()
      .eq("key", key);

    if (error) {
      console.error(`Erro ao deletar secret ${key}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Erro ao deletar secret ${key}:`, error);
    return false;
  }
}
