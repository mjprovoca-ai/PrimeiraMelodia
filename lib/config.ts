// Valores públicos do projeto (seguros para o navegador). As variáveis de ambiente, se existirem, têm prioridade.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wqhieedobswwbsuelsfc.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_pfEaiN3Ok-x7WYV3_pUgSA_eEdE_eXg";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://primeira-melodia.vercel.app").replace(/\/$/, "");
export const CONTATO = "fundacaoweb3@gmail.com";
