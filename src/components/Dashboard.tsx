import React from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus,
  Search,
  ArrowRight,
  Loader2,
  Bot
} from 'lucide-react';
import { cn } from '../lib/utils';
import { dbService } from '../services/dbService';
import { format } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, color, loading }: { icon: any, label: string, value: string | number, color: string, loading?: boolean }) => (
  <div className="bg-navy-card p-6 rounded-2xl border border-border-subtle shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
    {loading && (
      <div className="absolute inset-0 bg-navy-card/40 backdrop-blur-[1px] flex items-center justify-center z-10">
        <Loader2 className="animate-spin text-accent-blue/20" size={20} />
      </div>
    )}
    <div className="flex items-center gap-4">
      <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", color)}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-secondary uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      </div>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, onClick, highlight }: { icon: any, label: string, onClick: () => void, highlight?: boolean }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-3 p-6 bg-navy-card rounded-2xl border shadow-sm transition-all group",
      highlight 
        ? "border-accent-blue bg-accent-blue/5 shadow-lg shadow-accent-blue/10" 
        : "border-border-subtle hover:border-accent-blue hover:shadow-lg hover:shadow-accent-blue/10"
    )}
  >
    <div className={cn(
      "p-4 rounded-full transition-colors",
      highlight ? "bg-accent-blue text-white" : "bg-navy-deep group-hover:bg-accent-blue/10"
    )}>
      <Icon size={24} className={cn(
        highlight ? "text-white" : "text-text-secondary group-hover:text-accent-blue"
      )} />
    </div>
    <span className="text-sm font-bold text-text-primary">{label}</span>
  </button>
);

export const Dashboard = ({ onNavigate }: { onNavigate?: (tab: string) => void }) => {
  const [stats, setStats] = React.useState({
    today: 0,
    pending: 0,
    newPatients: 0,
    confirmed: 0
  });
  const [recentAppointments, setRecentAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      // Fetch appointments for today
      const allAppointments = await dbService.getCollection('appointments');
      const todayAppointments = allAppointments.filter((a: any) => a.appointment_date === todayStr);
      
      const patients = await dbService.getCollection('patients');

      setStats({
        today: todayAppointments.length,
        pending: todayAppointments.filter((a: any) => a.status === 'pending').length,
        newPatients: patients.length, // Simplified
        confirmed: todayAppointments.filter((a: any) => a.status === 'confirmed').length
      });

      setRecentAppointments(allAppointments.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Calendar} 
          label="Citas Hoy" 
          value={stats.today} 
          color="bg-accent-blue" 
          loading={loading}
        />
        <StatCard 
          icon={Clock} 
          label="Pendientes" 
          value={stats.pending} 
          color="bg-amber-500" 
          loading={loading}
        />
        <StatCard 
          icon={Users} 
          label="Pacientes Totales" 
          value={stats.newPatients} 
          color="bg-indigo-500" 
          loading={loading}
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Confirmadas" 
          value={stats.confirmed} 
          color="bg-emerald-500" 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-lg font-bold text-text-primary">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickAction 
              icon={Bot} 
              label="Agente IA" 
              highlight 
              onClick={() => onNavigate?.('agent')} 
            />
            <QuickAction icon={Plus} label="Agendar Cita" onClick={() => onNavigate?.('agenda')} />
            <QuickAction icon={Search} label="Buscar Paciente" onClick={() => onNavigate?.('patients')} />
            <QuickAction icon={Clock} label="Reprogramar" onClick={() => onNavigate?.('agenda')} />
          </div>
          
          <div className="bg-navy-card border border-border-subtle p-8 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <h4 className="text-xl font-bold mb-2 text-text-primary">Ocupación de Recursos</h4>
              <p className="text-text-secondary text-sm mb-6">Estado actual de consultorios y equipos.</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-text-secondary">
                    <span>Consultorios</span>
                    <span className="text-text-primary">85%</span>
                  </div>
                  <div className="h-1.5 bg-navy-deep rounded-full overflow-hidden">
                    <div className="h-full bg-accent-blue w-[85%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-text-secondary">
                    <span>Equipos</span>
                    <span className="text-text-primary">40%</span>
                  </div>
                  <div className="h-1.5 bg-navy-deep rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[40%]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent-blue/5 rounded-full blur-3xl" />
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">Próximas Citas</h3>
            <button className="text-sm font-bold text-accent-blue flex items-center gap-1 hover:underline">
              Ver todas <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="bg-navy-card rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-navy-deep/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-secondary">Paciente</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-secondary">Hora</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-secondary">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {recentAppointments.length > 0 ? (
                  recentAppointments.map((apt, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-text-primary group-hover:text-accent-blue transition-colors">ID: {apt.patient_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Clock size={14} />
                          <span className="text-sm font-medium">{apt.start_time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          apt.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        )}>
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-text-secondary italic">
                      No hay citas recientes registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
