import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NODO — Automatización IA para PYMEs",
  description:
    "Captura, califica con IA y responde tus leads en segundos, sin mover un dedo. Esta misma página es la máquina funcionando en vivo.",
  openGraph: {
    title: "NODO — La máquina de leads que trabaja sola",
    description:
      "Deja tus datos y mira cómo la IA clasifica tu mensaje, te escribe y avisa al equipo en tiempo real.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
