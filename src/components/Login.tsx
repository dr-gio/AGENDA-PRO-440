import React from 'react';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck, Stethoscope, AlertCircle } from 'lucide-react';

export const Login = ({ onLogin }: { onLogin: (email: string, pass: string) => Promise<void> }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-shake">
              <AlertCircle size={18} />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@440clinic.com"
              className="w-full px-6 py-4 bg-navy-deep border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all font-medium text-text-primary placeholder:text-text-secondary/30"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-6 py-4 bg-navy-deep border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all font-medium text-text-primary placeholder:text-text-secondary/30"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-accent-blue text-white rounded-2xl font-bold text-lg hover:bg-accent-hover shadow-xl shadow-accent-blue/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={20} />
                Entrar a Clínica 440
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-border-subtle flex items-center justify-center gap-2 text-text-secondary/30">
          <ShieldCheck size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Acceso Seguro vía Supabase Auth</span>
        </div>
      </motion.div>
    </div>
  );
};
