// Dados fixos do app: mundos, estilos musicais e formatação.

export type Mundo = "floresta" | "oceano" | "animais" | "universo";

export const MUNDOS: Record<Mundo, { nome: string; emoji: string; frase: string; item: string; plural: string; cor: string }> = {
  floresta: { nome: "Floresta", emoji: "🌳", frase: "Cada música planta uma árvore na sua floresta.", item: "árvore", plural: "árvores", cor: "#22C55E" },
  oceano: { nome: "Oceano", emoji: "🐟", frase: "Cada música traz vida nova para o seu oceano.", item: "peixe", plural: "seres do mar", cor: "#38BDF8" },
  animais: { nome: "Animais", emoji: "🦜", frase: "Cada música traz um bicho de volta para casa.", item: "bicho", plural: "bichos", cor: "#FFC93A" },
  universo: { nome: "Universo", emoji: "✨", frase: "Cada música acende uma estrela no seu céu.", item: "estrela", plural: "estrelas", cor: "#B3AB90" },
};

export const ORDEM_MUNDOS: Mundo[] = ["floresta", "oceano", "animais", "universo"];

export const ESTILOS: { id: string; nome: string }[] = [
  { id: "pop", nome: "Pop" },
  { id: "mpb", nome: "MPB" },
  { id: "sertanejo", nome: "Sertanejo" },
  { id: "samba", nome: "Samba" },
  { id: "pagode", nome: "Pagode" },
  { id: "forro", nome: "Forró" },
  { id: "bossa", nome: "Bossa nova" },
  { id: "rock", nome: "Pop rock" },
  { id: "gospel", nome: "Gospel" },
  { id: "infantil", nome: "Infantil" },
  { id: "reggae", nome: "Reggae" },
  { id: "eletronica", nome: "Eletrônica" },
  { id: "romantica", nome: "Romântica" },
];

export const nomeEstilo = (id: string) => ESTILOS.find((e) => e.id === id)?.nome ?? id;

export function brl(centavos: number | null | undefined) {
  return ((centavos ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dataCurta(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
}

export function dataHora(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  });
}

export function duracao(segundos: number | null | undefined) {
  const s = Math.max(0, Math.round(Number(segundos) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export const STATUS_CRIACAO: Record<string, { rotulo: string; cor: string }> = {
  na_fila: { rotulo: "Na fila", cor: "var(--sol)" },
  gerando: { rotulo: "Criando…", cor: "var(--laranja)" },
  pronta: { rotulo: "Pronta", cor: "var(--verde-claro)" },
  erro: { rotulo: "Não deu certo", cor: "var(--vermelho)" },
  recusada: { rotulo: "Não virou música", cor: "var(--cinza)" },
};
