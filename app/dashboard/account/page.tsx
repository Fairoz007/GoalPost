"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { ShieldCheck, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const profile = useQuery(api.users.getProfile);
  const role = useQuery(api.platformAdmin.currentRole);
  const deleteMyData = useMutation(api.users.deleteMyData);
  const { signOut } = useClerk();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!window.confirm("Delete your D-One Arena profile, registrations, invitations, and private contact data? Tournament history may be anonymized. This cannot be undone.")) return;
    setDeleting(true); setError("");
    try { await deleteMyData({}); await signOut({ redirectUrl: "/" }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete your account data."); setDeleting(false); }
  };

  return <div className="mx-auto max-w-3xl space-y-8 py-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-primary">Account controls</p><h1 className="mt-2 font-display text-4xl font-bold uppercase">Account & privacy</h1></div><section className="rounded-2xl border border-border bg-card p-6 sm:p-8"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 size-5 text-primary" /><div><h2 className="font-display text-2xl font-bold uppercase">Arena identity</h2><p className="mt-2 text-sm text-muted-foreground">{profile?.name ?? "Loading profile…"}{profile?.email ? ` · ${profile.email}` : ""}</p>{role === "platform_admin" && <p className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">Platform administrator</p>}</div></div></section><section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 sm:p-8"><h2 className="font-display text-2xl font-bold uppercase text-destructive">Delete Arena data</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Removes your Arena profile, private registrations, invitations, and contact information. Public competition history is anonymized where it must remain for fair standings.</p>{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}<Button variant="destructive" className="mt-6" onClick={handleDelete} disabled={deleting}><Trash2 className="size-4" />{deleting ? "Deleting…" : "Delete my Arena data"}</Button></section></div>;
}
