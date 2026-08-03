export function normalizarPlaca(placa: string): string {
  return placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}
