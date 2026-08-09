"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Save, Settings } from "lucide-react";

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as Id<"tournaments">;
  const isInvalidId = !tournamentId || tournamentId === "undefined";
  
  const tournament = useQuery(api.tournaments.getById, isInvalidId ? "skip" : { id: tournamentId });
  const updateTournament = useMutation(api.tournaments.update);
  const removeTournament = useMutation(api.tournaments.remove);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Draft" | "Upcoming" | "Registration Open" | "Ongoing" | "Completed" | "Cancelled">("Upcoming");
  const [prizePool, setPrizePool] = useState("");
  const [registrationGroupUrl, setRegistrationGroupUrl] = useState("");
  const [registrationInstructions, setRegistrationInstructions] = useState("");

  useEffect(() => {
    if (tournament) {
      setName(tournament.name);
      setDescription(tournament.description || "");
      setStatus(tournament.status as any);
      setPrizePool(tournament.prizePool || "");
      setRegistrationGroupUrl(tournament.registrationGroupUrl || "");
      setRegistrationInstructions(tournament.registrationInstructions || "");
    }
  }, [tournament]);

  if (tournament === undefined) {
    return <div className="animate-pulse space-y-4 h-96 bg-secondary/50 rounded-2xl w-full"></div>;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTournament({
      id: tournamentId,
      name,
      description,
      status,
      prizePool,
      registrationGroupUrl,
      registrationInstructions,
    });
    alert("Settings saved successfully.");
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to permanently delete this tournament? This action cannot be undone.")) {
      await removeTournament({ id: tournamentId });
      router.push("/dashboard/tournaments");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="rounded-2xl border border-border bg-card shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border/50">
          <div className="rounded-lg bg-primary/20 p-2">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white">General Settings</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-secondary/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary/30 min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Tournament Status</Label>
            <Select value={status} onValueChange={(val: any) => setStatus(val)}>
              <SelectTrigger className="bg-secondary/30">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Upcoming">Upcoming</SelectItem>
                <SelectItem value="Registration Open">Registration Open</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prizePool">Prize Pool (Optional)</Label>
            <Input id="prizePool" value={prizePool} onChange={(e) => setPrizePool(e.target.value)} placeholder="₹25,000 or Trophy" className="bg-secondary/30" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationGroupUrl">Registration Group / Contact URL (Optional)</Label>
            <Input id="registrationGroupUrl" type="url" value={registrationGroupUrl} onChange={(e) => setRegistrationGroupUrl(e.target.value)} placeholder="https://chat.whatsapp.com/…" className="bg-secondary/30" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationInstructions">Registration Instructions (Optional)</Label>
            <Textarea id="registrationInstructions" value={registrationInstructions} onChange={(e) => setRegistrationInstructions(e.target.value)} placeholder="Join the group after submitting and contact the organizer." className="bg-secondary/30 min-h-[90px]" />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="gap-2 shadow-[0_0_15px_rgba(0,210,106,0.2)]">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-danger/30 bg-danger/5 shadow-sm p-8">
        <h3 className="text-xl font-display font-bold text-danger mb-2">Danger Zone</h3>
        <p className="text-muted-foreground mb-6 text-sm">
          Once you delete a tournament, there is no going back. Please be certain.
        </p>
        <Button 
          variant="destructive" 
          onClick={handleDelete}
          className="gap-2 font-semibold shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        >
          <Trash2 className="h-4 w-4" />
          Delete Tournament
        </Button>
      </div>
    </motion.div>
  );
}
