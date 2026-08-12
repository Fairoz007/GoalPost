import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://arena.donestudio.in"),
  title: {
    default: "D-One Arena — Play. Compete. Become Champion.",
    template: "%s | D-One Arena",
  },
  description:
    "D-One Arena by DoneStudio is a premium esports tournament platform for eFootball, VALORANT, and the games coming next.",
  generator: "DoneStudio",
  keywords: [
    "esports tournaments",
    "eFootball",
    "VALORANT",
    "tournament hosting",
    "brackets",
    "rankings",
  ],
  openGraph: {
    title: "D-One Arena",
    description: "Enter the arena. Play, compete, become champion.",
    url: "https://arena.donestudio.in",
    siteName: "D-One Arena",
    type: "website",
  },
};
export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#070707",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark bg-background ${geistSans.variable} ${geistMono.variable} ${oswald.variable}`}
    >
      <body className="font-sans antialiased">
        <ClerkProvider appearance={{ variables: { colorPrimary: "#f97316", borderRadius: "0.75rem", colorBackground: "#111111", colorForeground: "#fafafa", colorInput: "#181818", colorInputForeground: "#fafafa" } }}>
          <TooltipProvider>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </TooltipProvider>
        </ClerkProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
