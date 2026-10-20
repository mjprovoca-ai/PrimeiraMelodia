import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import "./globals.css";
import Ceu from "@/components/Ceu";
import Tema from "@/components/Tema";
import PalcoProvider from "@/components/PalcoProvider";
import MiniPalco from "@/components/MiniPalco";
import { SITE_URL } from "@/lib/config";

const montserrat = localFont({
  src: "./fonts/montserrat.woff2",
  weight: "100 900",
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Primeira Melodia · Crie uma música. Emocione quem você ama.", template: "%s · Primeira Melodia" },
  description:
    "Transforme sua emoção em música com inteligência artificial. 10% da receita de cada música vai para projetos que cuidam da natureza, dos animais e dos oceanos.",
  applicationName: "Primeira Melodia",
  openGraph: {
    title: "Primeira Melodia",
    description: "Crie uma música. Emocione quem você ama. Música em apoio ao planeta.",
    locale: "pt_BR",
    type: "website",
    siteName: "Primeira Melodia",
  },
  appleWebApp: { capable: true, title: "Primeira Melodia", statusBarStyle: "black-translucent" },
};

export async function generateViewport(): Promise<Viewport> {
  const dia = (await cookies()).get("pm-ceu")?.value === "light";
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: dia ? "#F7C2AB" : "#0D0B24",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tema = (await cookies()).get("pm-ceu")?.value === "light" ? "light" : "dark";
  return (
    <html lang="pt-BR" data-theme={tema} className={montserrat.variable}>
      <body>
        <PalcoProvider>
          <Ceu />
          <div className="flutuante">
            <div className="flutuante-in">
              <MiniPalco />
              <Tema />
            </div>
          </div>
          <div className="pagina">{children}</div>
        </PalcoProvider>
      </body>
    </html>
  );
}
