export function maskCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `****-****-****-${digits.slice(-4)}`;
}

export function maskCvv(value: string): string {
  return "*".repeat(value.length);
}

export function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return "***";
  if (digits.length <= 11) {
    return `${digits.slice(0, 3)}.***.${digits.slice(-2)}`;
  }
  return `${digits.slice(0, 2)}.***.***/${digits.slice(-2)}`;
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return "**";
  return `(${digits.slice(0, 2)}) ****-${digits.slice(-4)}`;
}

export function maskEmail(value: string): string {
  const [local, domain] = value.split("@");
  if (!domain) return "***";
  const maskedLocal = local.length <= 2 ? "**" : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

export function maskSecret(value: string): string {
  if (!value) return "***";
  return `${value.slice(0, 4)}${"*".repeat(Math.max(0, value.length - 8))}${value.slice(-4)}`;
}
