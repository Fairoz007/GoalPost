"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Calendar, Download, Upload } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function FAB() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: Users, label: "Create Group", color: "bg-primary text-primary-foreground" },
    { icon: Calendar, label: "Generate Fixtures", color: "bg-secondary text-white" },
    { icon: Upload, label: "Import Teams", color: "bg-secondary text-white" },
    { icon: Download, label: "Export Data", color: "bg-secondary text-white" },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col gap-3 items-end"
          >
            {actions.map((action, idx) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (actions.length - idx) * 0.05 }}
                className="flex items-center gap-3 group"
              >
                <span className="rounded-md bg-card border border-border px-3 py-1.5 text-sm font-medium shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-white">
                  {action.label}
                </span>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110", action.color)}>
                  <action.icon className="h-5 w-5" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,210,106,0.4)] transition-transform hover:scale-105 active:scale-95"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Plus className="h-8 w-8" />
        </motion.div>
      </button>
    </div>
  );
}
