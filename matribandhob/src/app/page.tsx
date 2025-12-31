"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Stethoscope, Ambulance, ArrowRight, ShieldCheck, Activity, Users, Radio } from "lucide-react";

export default function LandingPage() {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-rose-500/30 overflow-hidden relative flex flex-col">
      
      {/* --- Animated Background Grid --- */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-[128px]" 
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, 50, 0] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[128px]" 
        />
      </div>

      {/* --- Navigation / Brand --- */}
      <nav className="relative z-20 w-full max-w-7xl mx-auto p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-rose-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Heart size={18} className="text-white fill-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Matri-Bandhob</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
          <span className="hidden md:flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-500"/> Secure</span>
          <span className="hidden md:flex items-center gap-1"><Activity size={14} className="text-blue-500"/> Live</span>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-7xl mx-auto">
        
        {/* Hero Text */}
        <div className="text-center mb-16 max-w-3xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight"
          >
            Universal <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Maternal</span> <br/> Safety Net.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto"
          >
            Connecting mothers, doctors, and emergency response units in one unified, real-time ecosystem.
          </motion.p>
        </div>

        {/* Roles Grid - Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-[500px] md:h-[400px]">
          
          {/* 1. MOTHER CARD */}
          <RoleCard 
            id="patient"
            href="/patient"
            title="Mother"
            subtitle="Request Care & SOS"
            icon={Heart}
            color="rose"
            hovered={hoveredRole}
            setHovered={setHoveredRole}
            bgImage="radial-gradient(circle at top right, rgba(244, 63, 94, 0.1), transparent)"
          />

          {/* 2. DOCTOR CARD */}
          <RoleCard 
            id="doctor"
            href="/doctor"
            title="Doctor"
            subtitle="Monitor & Prescribe"
            icon={Stethoscope}
            color="emerald"
            hovered={hoveredRole}
            setHovered={setHoveredRole}
            bgImage="radial-gradient(circle at top right, rgba(16, 185, 129, 0.1), transparent)"
          />

          {/* 3. DRIVER CARD */}
          <RoleCard 
            id="driver"
            href="/driver"
            title="Driver"
            subtitle="Emergency Fleet"
            icon={Ambulance}
            color="blue"
            hovered={hoveredRole}
            setHovered={setHoveredRole}
            bgImage="radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent)"
          />

        </div>

      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full p-6 text-center text-slate-600 text-xs">
        <p>&copy; 2025 Matri-Bandhob Initiative. AI-Powered Healthcare.</p>
      </footer>

    </div>
  );
}

// --- Unique Role Card Component ---
function RoleCard({ id, href, title, subtitle, icon: Icon, color, hovered, setHovered, bgImage }: any) {
  const isHovered = hovered === id;
  const isDimmed = hovered !== null && hovered !== id;

  // Dynamic Styles based on color prop
  const colors: any = {
    rose: { text: "text-rose-400", border: "group-hover:border-rose-500/50", glow: "group-hover:shadow-rose-500/20" },
    emerald: { text: "text-emerald-400", border: "group-hover:border-emerald-500/50", glow: "group-hover:shadow-emerald-500/20" },
    blue: { text: "text-blue-400", border: "group-hover:border-blue-500/50", glow: "group-hover:shadow-blue-500/20" }
  };

  return (
    <Link 
      href={href}
      className={`relative group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm transition-all duration-500 ease-out ${colors[color].border} ${isDimmed ? 'opacity-40 scale-95 blur-[1px]' : 'opacity-100 scale-100'} hover:shadow-2xl ${colors[color].glow}`}
      onMouseEnter={() => setHovered(id)}
      onMouseLeave={() => setHovered(null)}
      style={{ background: bgImage }}
    >
      <div className="absolute inset-0 bg-noise opacity-5"></div>
      
      <div className="h-full flex flex-col items-center justify-center p-8 relative z-10">
        <motion.div 
          animate={{ scale: isHovered ? 1.1 : 1, y: isHovered ? -10 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`p-5 rounded-2xl bg-slate-800/50 mb-6 ${colors[color].text}`}
        >
          <Icon size={40} strokeWidth={1.5} />
        </motion.div>

        <h3 className="text-3xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 font-medium">{subtitle}</p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          className={`mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${colors[color].text}`}
        >
          Enter Portal <ArrowRight size={16} />
        </motion.div>
      </div>

      {/* Decorative Hover Effect */}
      <motion.div 
        className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-[80px] transition-colors duration-500 ${isHovered ? (color === 'rose' ? 'bg-rose-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-blue-600') : 'bg-transparent'}`} 
      />
    </Link>
  );
}