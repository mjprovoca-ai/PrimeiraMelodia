// Ícones de interface (traço arredondado, mesma espessura). Os ícones das abas vêm do kit de marca (public/marca/abas).
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "ic",
  "aria-hidden": true,
  ...p,
});

export const IcPlay = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
);
export const IcPause = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><rect x="6" y="4.5" width="4.2" height="15" rx="1.4" /><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.4" /></svg>
);
export const IcProxima = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M5 6.2v11.6a.9.9 0 0 0 1.4.75l8.4-5.8a.9.9 0 0 0 0-1.5L6.4 5.45A.9.9 0 0 0 5 6.2Z" /><rect x="16.4" y="5" width="2.8" height="14" rx="1.2" /></svg>
);
export const IcAnterior = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M19 6.2v11.6a.9.9 0 0 1-1.4.75l-8.4-5.8a.9.9 0 0 1 0-1.5l8.4-5.8A.9.9 0 0 1 19 6.2Z" /><rect x="4.8" y="5" width="2.8" height="14" rx="1.2" /></svg>
);
export const IcVoltar = (p: P) => <svg {...base(p)}><path d="m15 18-6-6 6-6" /></svg>;
export const IcSeta = (p: P) => <svg {...base(p)}><path d="m9 18 6-6-6-6" /></svg>;
export const IcSol = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></svg>
);
export const IcLua = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a.6.6 0 0 0-.8-.7A9.4 9.4 0 1 0 21.2 15.4a.6.6 0 0 0-.7-.8Z" /></svg>
);
export const IcDoc = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M6 2.5h7.6l5.4 5.4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V4a1.5 1.5 0 0 1 1-1.5Zm7 .9V8a1 1 0 0 0 1 1h4.6M8 12.5h8M8 16h8" /><path d="M8 12.5h8M8 16h8M13 3.4V8a1 1 0 0 0 1 1h4.6" stroke="#121212" strokeWidth="1.6" fill="none" /></svg>
);
export const IcBrilho = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M10 3.5c.6 3.6 2 5 5.6 5.6-3.6.6-5 2-5.6 5.6-.6-3.6-2-5-5.6-5.6 3.6-.6 5-2 5.6-5.6Z" /><path d="M17.6 12.8c.35 2 1.1 2.75 3.1 3.1-2 .35-2.75 1.1-3.1 3.1-.35-2-1.1-2.75-3.1-3.1 2-.35 2.75-1.1 3.1-3.1ZM17.4 2.6c.25 1.4.75 1.9 2.15 2.15-1.4.25-1.9.75-2.15 2.15-.25-1.4-.75-1.9-2.15-2.15 1.4-.25 1.9-.75 2.15-2.15Z" /></svg>
);
export const IcCompartilhar = (p: P) => (
  <svg {...base(p)}><circle cx="18" cy="5" r="2.6" /><circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="19" r="2.6" /><path d="m8.3 13.3 7.4 4.4M15.7 6.3l-7.4 4.4" /></svg>
);
export const IcCopiar = (p: P) => (
  <svg {...base(p)}><rect x="8.5" y="8.5" width="12" height="12" rx="2.4" /><path d="M15.5 8.5V5.9a2.4 2.4 0 0 0-2.4-2.4H5.9a2.4 2.4 0 0 0-2.4 2.4v7.2a2.4 2.4 0 0 0 2.4 2.4h2.6" /></svg>
);
export const IcOk = (p: P) => <svg {...base(p)}><path d="m4.5 12.5 4.6 4.6L19.5 6.7" /></svg>;
export const IcEscudo = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 2.4 4.5 5.3v6.2c0 4.6 3.1 8.6 7.5 10.1 4.4-1.5 7.5-5.5 7.5-10.1V5.3Z" /><path d="m8.6 12.2 2.4 2.4 4.5-4.6" stroke="#121212" strokeWidth="2" fill="none" /></svg>
);
export const IcMedalha = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="9" r="5.5" /><path d="m8.6 13.4-2.1 7.4L12 18l5.5 2.8-2.1-7.4" /></svg>
);
export const IcSair = (p: P) => (
  <svg {...base(p)}><path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14" /><path d="m17 8 4 4-4 4M10.5 12H21" /></svg>
);
export const IcPresente = (p: P) => (
  <svg {...base(p)}><rect x="3.5" y="8.5" width="17" height="4" rx="1" /><path d="M5 12.5v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7M12 8.5v12M12 8.5S10.6 3.5 7.9 4.3c-2.4.7-.9 4.2 4.1 4.2ZM12 8.5s1.4-5 4.1-4.2c2.4.7.9 4.2-4.1 4.2Z" /></svg>
);
export const IcSino = (p: P) => (
  <svg {...base(p)}><path d="M6 9.5a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15.5 6 9.5ZM10 20.5a2.2 2.2 0 0 0 4 0" /></svg>
);
export const IcAmpulheta = (p: P) => (
  <svg {...base(p)}><path d="M6.5 3h11M6.5 21h11M7.5 3c0 5 4.5 6 4.5 9s-4.5 4-4.5 9M16.5 3c0 5-4.5 6-4.5 9s4.5 4 4.5 9" /></svg>
);
export const IcWhats = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.3-.3Z" /></svg>
);
export const IcSemente = (p: P) => (
  <svg viewBox="0 0 24 24" className="semente" aria-hidden {...p}><path d="M12 21c-4.5 0-7-3.4-7-7.3C5 8.6 9.8 4.2 12 3c2.2 1.2 7 5.6 7 10.7 0 3.9-2.5 7.3-7 7.3Z" fill="#22C55E" /><path d="M12 19.5V10.5" stroke="#86EFAC" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
export const IcGoogle = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden className="ic" {...p}><path fill="currentColor" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" /><path fill="currentColor" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.75-5.59-4.1H3.07v2.58A10 10 0 0 0 12 22Z" opacity=".9" /><path fill="currentColor" d="M6.41 13.93a6 6 0 0 1 0-3.86V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.58Z" opacity=".8" /><path fill="currentColor" d="M12 5.97c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.58C7.2 7.72 9.4 5.97 12 5.97Z" opacity=".95" /></svg>
);
export const IcNota = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M10.4 3.7v10.4a3.4 3.4 0 1 0 2.5 3.3V8l6.7 1V5.2Z" /></svg>
);
export const IcEditar = (p: P) => <svg {...base(p)}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4" /></svg>;
export const IcAlvo = (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>;

/** Ícone das abas do app (desenho do kit de marca, colorido pela cor do texto). */
export function IcAba({ nome }: { nome: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: 26,
        height: 26,
        display: "block",
        backgroundColor: "currentColor",
        WebkitMask: `url(/marca/abas/${nome}.svg) center / contain no-repeat`,
        mask: `url(/marca/abas/${nome}.svg) center / contain no-repeat`,
      }}
    />
  );
}
