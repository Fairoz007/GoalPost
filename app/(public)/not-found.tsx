import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
export default function PublicNotFound() { return <section className="grid min-h-[70vh] place-items-center px-4 py-16"><div className="max-w-lg text-center"><SearchX className="mx-auto size-12 text-primary" /><p className="mt-6 text-xs font-bold uppercase tracking-[.24em] text-primary">404 · Outside the arena</p><h1 className="mt-3 font-display text-5xl font-bold uppercase">Page not found</h1><p className="mt-4 text-muted-foreground">This link may be invalid, private, or no longer available.</p><Link href="/" className={`${buttonVariants({ size: "lg" })} mt-8`}><ArrowLeft className="size-4" />Back to the arena</Link></div></section>; }
