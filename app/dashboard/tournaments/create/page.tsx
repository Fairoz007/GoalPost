"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Copy, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CreateTournamentPage() {
  const router = useRouter();
  const createTournament = useMutation(api.tournaments.create);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [format, setFormat] = useState<"Knockout" | "League" | "Groups" | "Single Group + Finals">("Single Group + Finals");
  
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !format) return;

    const adminCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const id = await createTournament({
        name,
        description,
        startDate,
        format,
        status: "Upcoming",
        adminCode,
      });
      
      // Save it locally automatically so the creator doesn't need to login
      localStorage.setItem(`admin_code_${id}`, adminCode);
      
      setGeneratedCode(adminCode);
      setCreatedId(id);
    } catch (error) {
      console.error("Failed to create tournament", error);
    }
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (generatedCode && createdId) {
    return (
      <div className="mx-auto max-w-2xl mt-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-primary/50 bg-card p-8 text-center shadow-[0_0_30px_rgba(0,210,106,0.15)]"
        >
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-4">Tournament Created!</h2>
          <p className="text-muted-foreground mb-8">
            Your tournament has been created successfully. Below is your unique Admin Passcode. 
            <strong className="block mt-2 text-foreground">Save this code! You will need it to manage your tournament from other devices.</strong>
          </p>
          
          <div className="bg-secondary/50 border border-border rounded-lg p-6 mb-8 max-w-md mx-auto flex items-center justify-between">
            <span className="font-mono text-4xl tracking-widest font-black text-primary select-all">
              {generatedCode}
            </span>
            <Button size="icon" variant="outline" onClick={handleCopy}>
              {copied ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>

          <Button 
            size="lg" 
            className="w-full max-w-md"
            onClick={() => router.push(`/dashboard/tournaments/${createdId}`)}
          >
            Go to Tournament Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tournaments" className="rounded-full p-2 hover:bg-accent">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-3xl font-bold">Create Tournament</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name</Label>
            <Input
              id="name"
              placeholder="e.g. Premier Champions League"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="A short description of the tournament..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select value={format} onValueChange={(val: any) => setFormat(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single Group + Finals">Single Group (Top 2 to Finals)</SelectItem>
                  <SelectItem value="Knockout">Knockout Bracket</SelectItem>
                  <SelectItem value="League">League (Round Robin)</SelectItem>
                  <SelectItem value="Groups">Group Stage + Knockout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">Create Tournament</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
