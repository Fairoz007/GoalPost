"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Plus, Trash, Search } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { getIsoFromFlagString, getNameFromFlagString } from "@/lib/countries";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ParticipantsTabProps {
  tournamentId: Id<"tournaments">;
  participants: any[];
  onAddParticipant: (name: string, flag: string) => void;
  onRemoveParticipant?: (id: Id<"participants">) => void;
}

export function ParticipantsTab({ tournamentId, participants, onAddParticipant, onRemoveParticipant }: ParticipantsTabProps) {
  const [newName, setNewName] = useState("");
  const [newFlag, setNewFlag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    onAddParticipant(newName, newFlag);
    setNewName("");
    setNewFlag("");
  };

  const historicalParticipants = useQuery(api.participants.getAllUnique, { tournamentId }) || [];
  
  const handleSelectHistorical = (participantId: string | null) => {
    if (!participantId) return;
    const p = historicalParticipants.find(x => x._id === participantId);
    if (p) {
      setNewName(p.name);
      setNewFlag(p.flag || "");
    }
  };

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Add Participant Card */}
        <div className="w-full md:w-1/3 shrink-0">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sticky top-28">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-display font-semibold text-white">Add Participant</h3>
            </div>
            
            {historicalParticipants.length > 0 && (
              <div className="mb-6 space-y-2">
                <label className="text-xs font-medium text-primary uppercase tracking-wider">Quick Import</label>
                <Select onValueChange={handleSelectHistorical}>
                  <SelectTrigger className="bg-secondary/50 border-border/50 focus-visible:ring-primary/50 h-10 w-full text-muted-foreground">
                    <SelectValue placeholder="Select from history..." />
                  </SelectTrigger>
                  <SelectContent>
                    {historicalParticipants.map(hp => (
                      <SelectItem key={hp._id} value={hp._id}>
                        <div className="flex items-center gap-2">
                          {getIsoFromFlagString(hp.flag) && (
                            <ReactCountryFlag countryCode={getIsoFromFlagString(hp.flag)!} svg style={{ width: '16px' }} />
                          )}
                          <span>{hp.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-center pt-2">
                  <div className="h-px bg-border flex-1"></div>
                  <span className="text-xs text-muted-foreground px-3 uppercase">OR</span>
                  <div className="h-px bg-border flex-1"></div>
                </div>
              </div>
            )}

            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Player Name</label>
                <Input 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder="e.g. John Doe" 
                  className="bg-secondary/50 border-border/50 focus-visible:ring-primary/50 h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team / Country</label>
                <Input
                  list="countries"
                  value={newFlag}
                  onChange={e => setNewFlag(e.target.value)}
                  placeholder="Search Country..."
                  className="bg-secondary/50 border-border/50 focus-visible:ring-primary/50 h-11"
                />
                <datalist id="countries">
                  <option value="🇦🇷 Argentina" />
                  <option value="🇧🇷 Brazil" />
                  <option value="🇵🇹 Portugal" />
                  <option value="🇮🇳 India" />
                  <option value="🇫🇷 France" />
                  <option value="🇩🇪 Germany" />
                  <option value="🇪🇸 Spain" />
                  <option value="🇮🇹 Italy" />
                  <option value="🏴󠁧󠁢󠁥󠁮󠁧󠁿 England" />
                  <option value="🇳🇱 Netherlands" />
                  <option value="🇧🇪 Belgium" />
                  <option value="🇺🇾 Uruguay" />
                  <option value="🇭🇷 Croatia" />
                  <option value="🇲🇦 Morocco" />
                  <option value="🇯🇵 Japan" />
                  <option value="🇰🇷 South Korea" />
                  <option value="🇺🇸 USA" />
                  <option value="🇲🇽 Mexico" />
                  <option value="🇨🇴 Colombia" />
                  <option value="🇨🇱 Chile" />
                </datalist>
              </div>
              <Button type="submit" className="w-full mt-2 h-11 shadow-[0_0_15px_rgba(0,210,106,0.2)]">
                <Plus className="mr-2 h-4 w-4" />
                Add Participant
              </Button>
            </form>
          </div>
        </div>

        {/* Participants List */}
        <div className="flex-1 rounded-2xl border border-border bg-card shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-semibold text-white flex items-center gap-2">
              All Participants
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs text-primary font-bold">
                {participants.length}
              </span>
            </h3>
            
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search players..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary/50 border-border/50 h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredParticipants.map((p, idx) => {
              const iso = getIsoFromFlagString(p.flag);
              const countryName = getNameFromFlagString(p.flag);

              return (
                <motion.div 
                  key={p._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="group flex items-center justify-between rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/60 p-3 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="font-semibold text-white tracking-wide text-[15px]">{p.name}</span>
                    
                    <div className="ml-2 flex items-center shrink-0" title={countryName || "Unknown Country"}>
                      {iso ? (
                        <div className="h-4 w-5 overflow-hidden rounded-[3px] shadow-sm flex items-center justify-center bg-black/10">
                          <ReactCountryFlag 
                            countryCode={iso} 
                            svg 
                            style={{
                              width: '20px',
                              height: '15px',
                              objectFit: 'cover'
                            }} 
                          />
                        </div>
                      ) : (
                        <Globe className="h-4 w-4 text-muted-foreground/60" />
                      )}
                    </div>
                  </div>
                  
                  {onRemoveParticipant && (
                    <button 
                      onClick={() => onRemoveParticipant(p._id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  )}
                </motion.div>
              );
            })}
            
            {filteredParticipants.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No participants found. Add a player to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
