"use client";

import { useEffect } from "react";
import { supabaseNavegador } from "@/lib/supabase/client";

export default function MarcarLidas() {
  useEffect(() => {
    const t = setTimeout(() => {
      supabaseNavegador().rpc("marcar_notificacoes_lidas").then(() => {}, () => {});
    }, 1500);
    return () => clearTimeout(t);
  }, []);
  return null;
}
