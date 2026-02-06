// Formata número para moeda brasileira (R$ 1.234,56)
export function formatCurrencyBR(value) {
  if (value === null || value === undefined || value === "") return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

// Converte string DD/MM/AAAA para ISO (AAAA-MM-DD)
export function parseDateBRToISO(value) {
  if (!value) return "";
  const [dia, mes, ano] = value.split("/");
  if (!dia || !mes || !ano) return "";
  return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

// Converte string ISO (AAAA-MM-DD) para DD/MM/AAAA
export function formatDateISOToBR(value) {
  if (!value) return "";
  const [ano, mes, dia] = value.split("-");
  if (!ano || !mes || !dia) return "";
  return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${ano}`;
}

