import React from 'react';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck, Stethoscope } from 'lucide-react';

export const Login = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="min-h-screen bg-navy-main flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-navy-card p-10 rounded-[40px] border border-border-subtle shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 bg-accent-blue text-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-accent-blue/20">
            <Stethoscope size={40} />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2 tracking-tight">AGENDA 440</h1>
          <p className="text-text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">440 Clinic by Dr. Gio</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Correo Electrónico</label>
            <input
              type="email"
              placeholder="usuario@440clinic.com"
              className="w-full px-6 py-4 bg-navy-deep border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all font-medium text-text-primary placeholder:text-text-secondary/30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-6 py-4 bg-navy-deep border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all font-medium text-text-primary placeholder:text-text-secondary/30"
            />
          </div>

          <button
            onClick={onLogin}
            className="w-full py-5 bg-accent-blue text-white rounded-2xl font-bold text-lg hover:bg-accent-hover shadow-xl shadow-accent-blue/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <LogIn size={20} />
            Entrar con Supabase
          </button>
        </div>

        <div className="mt-10 pt-8 border-t border-border-subtle flex items-center justify-center gap-2 text-text-secondary/30">
          <ShieldCheck size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Acceso Seguro vía Supabase</span>
        </div>
      </motion.div>
    </div>
  );
};
