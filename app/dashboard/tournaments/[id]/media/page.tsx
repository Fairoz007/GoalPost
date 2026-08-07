"use client";

import { motion } from "framer-motion";

export default function MediaPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-12 text-center text-muted-foreground bg-card/30 rounded-2xl border border-border/50"
    >
      <div className="flex flex-col items-center justify-center p-12">
        <h2 className="text-2xl font-display font-semibold text-white mb-2">Media Gallery Module</h2>
        <p>Tournament photos and videos will be implemented here.</p>
      </div>
    </motion.div>
  );
}
