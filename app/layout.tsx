import type { Metadata } from "next";
import {
  Bebas_Neue,
  Barlow_Condensed,
  DM_Sans,
  JetBrains_Mono,
  Playfair_Display,
  Playfair_Display_SC,
  Courier_Prime,
} from "next/font/google";
import "./globals.css";
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});
const barlowCondensed = Barlow_Condensed({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow",
});
const dmSans = DM_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
});
const jetbrainsMono = JetBrains_Mono({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
});
const playfairDisplay = Playfair_Display({
  weight: ["400"],
  style: ["italic"],
  subsets: ["latin"],
  variable: "--font-playfair",
});
// New Fonts Implementation
const playfairSC = Playfair_Display_SC({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair-sc",
});
const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-courier-prime",
});
export const metadata: Metadata = {
  title: "halal. — OLPS COMELEC",
  description: "VOX POPULI VOX DEI",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="autocomplete" content="off" />
      </head>
      <body
        className={`
          ${bebasNeue.variable}
          ${barlowCondensed.variable}
          ${dmSans.variable}
          ${jetbrainsMono.variable}
          ${playfairDisplay.variable}
          ${playfairSC.variable}
          ${courierPrime.variable}
          font-body antialiased
        `}
      >
        {children}
      </body>
    </html>
  );
}
