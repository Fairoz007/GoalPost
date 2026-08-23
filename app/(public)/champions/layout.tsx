import type { Metadata } from "next";
export const metadata: Metadata = { title: "Hall of Fame", description: "D-One Arena tournament champions and title history.", alternates: { canonical: "/champions" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
