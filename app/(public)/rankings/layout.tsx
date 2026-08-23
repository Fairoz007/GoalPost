import type { Metadata } from "next";
export const metadata: Metadata = { title: "Arena Rankings", description: "Global eFootball and VALORANT competitor rankings.", alternates: { canonical: "/rankings" } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
