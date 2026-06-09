export function formatCOP(value) {
  const num = Number(value) || 0;
  return `$${num.toLocaleString("es-CO")}`;
}