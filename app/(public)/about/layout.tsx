import type { Metadata } from "next";
export const metadata: Metadata = { title: "About", description: "Learn about D-One Arena and its competitive esports platform.", alternates: { canonical: "/about" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
