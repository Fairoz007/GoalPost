import type { Metadata } from "next";
export const metadata: Metadata = { title: "Games", description: "Explore supported games and their D-One Arena tournaments.", alternates: { canonical: "/games" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
