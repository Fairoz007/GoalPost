import type { Metadata } from "next";
export const metadata: Metadata = { title: "Tournaments", description: "Browse upcoming, open, live, and completed esports tournaments.", alternates: { canonical: "/tournaments" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
