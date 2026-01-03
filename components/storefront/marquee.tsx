"use client";

import { motion } from "framer-motion";

export function Marquee() {
  return (
    <div className="bg-accent text-accent-foreground py-2.5 overflow-hidden">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center gap-8 px-4">
            <span className="text-sm font-bold tracking-wider">RARE GEMS</span>
            <span className="text-xs">★</span>
            <span className="text-sm font-bold tracking-wider">BRANDED</span>
            <span className="text-xs">★</span>
            <span className="text-sm font-bold tracking-wider">AFFORDABLE</span>
            <span className="text-xs">★</span>
            <span className="text-sm font-bold tracking-wider">EST. 2020</span>
            <span className="text-xs">★</span>
            <span className="text-sm font-bold tracking-wider">THRIFTING MADE EASY</span>
            <span className="text-xs">★</span>
            <span className="text-sm font-bold tracking-wider">100% AUTHENTIC</span>
            <span className="text-xs">★</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
