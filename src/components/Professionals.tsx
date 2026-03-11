import React from 'react';
import { 
  Plus, 
  Stethoscope, 
  Mail, 
  Phone, 
  Calendar, 
  MoreVertical,
  Circle,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { dbService } from '../services/dbService';

export const Professionals = () => {
  const [professionals, setProfessionals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const data = await dbService.getCollection('professionals');
      setProfessionals(data || []);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-text-primary tracking-tight">Equipo Médico</h3>
        <button className="flex items-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-xl font-bold hover:bg-accent-hover shadow-lg shadow-accent-blue/20 transition-all">
          <Plus size={18} />
          Nuevo Profesional
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-accent-blue" size={32} />
          </div>
        )}

        {professionals.length > 0 ? (
          professionals.map((pro, i) => (
            <div key={pro.id} className="bg-navy-card p-6 rounded-2xl border border-border-subtle shadow-lg hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-navy-deep flex items-center justify-center text-text-primary group-hover:bg-accent-blue group-hover:text-white transition-all border border-border-subtle">
                  <Stethoscope size={32} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest",
                    pro.type === 'interno' ? "bg-accent-blue/10 text-accent-blue" : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {pro.type}
                  </span>
                  <button className="p-2 hover:bg-white/10 rounded-lg text-text-secondary">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h4 className="text-lg font-bold text-text-primary">{pro.name}</h4>
                <p className="text-sm text-accent-blue font-medium">{pro.specialty}</p>
              </div>

              <div className="space-y-3 pt-6 border-t border-border-subtle">
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <Mail size={16} />
                  <span className="truncate">{pro.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <Calendar size={16} />
                  <span className="text-xs font-bold text-emerald-500">
                    {pro.calendar_id ? 'Google Calendar Conectado' : 'Sin Calendario'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-text-secondary/50">
                  <Circle size={8} className={cn("fill-current", pro.status === 'active' ? "text-emerald-500" : "text-gray-600")} />
                  <span>{pro.status === 'active' ? 'Disponible' : 'Inactivo'}</span>
                </div>
              </div>
            </div>
          ))
        ) : !loading && (
          <div className="col-span-full py-12 text-center text-text-secondary/30 italic">
            No hay profesionales registrados.
          </div>
        )}
      </div>
    </div>
  );
};
