import React from 'react';
import {
  Plus,
  Stethoscope,
  Mail,
  Calendar,
  MoreVertical,
  Circle,
  Loader2,
  X,
  User,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { dbService } from '../services/dbService';

// --- Professional Modal ---
const ProfessionalModal = ({
  isOpen,
  onClose,
  onSave,
  initialData
}: {
  isOpen: boolean,
  onClose: () => void,
  onSave: (data: any) => void,
  initialData?: any
}) => {
  const [formData, setFormData] = React.useState({
    name: '',
    specialty: '',
    email: '',
    type: 'internal',
    google_calendar_id: '',
    status: 'active'
  });

  React.useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData({ name: '', specialty: '', email: '', type: 'internal', google_calendar_id: '', status: 'active' });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-main/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-navy-card w-full max-w-lg rounded-3xl border border-border-subtle shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-xl font-bold text-text-primary capitalize">{initialData ? 'Editar Profesional' : 'Nuevo Profesional'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-text-secondary"><X size={20} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Nombre Completo</label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-4 bg-navy-deep border border-border-subtle rounded-xl text-text-primary focus:border-accent-blue outline-none transition-all"
              placeholder="Ej: Dr. Giovanni Fuentes"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Especialidad</label>
              <input
                required
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full p-4 bg-navy-deep border border-border-subtle rounded-xl text-text-primary focus:border-accent-blue outline-none transition-all"
                placeholder="Ej: Cirugía Estética"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-4 bg-navy-deep border border-border-subtle rounded-xl text-text-primary focus:border-accent-blue outline-none transition-all appearance-none"
              >
                <option value="internal">Interno</option>
                <option value="external">Externo / Invitado</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Correo Electrónico</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-4 bg-navy-deep border border-border-subtle rounded-xl text-text-primary focus:border-accent-blue outline-none transition-all"
              placeholder="ejemplo@clinic.com"
            />
          </div>

          <div className="p-4 bg-accent-blue/5 rounded-2xl border border-accent-blue/20 space-y-3">
            <div className="flex items-center gap-2 text-accent-blue">
              <Calendar size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Google Calendar Integration</span>
            </div>
            <p className="text-[10px] text-text-secondary leading-relaxed">Pega el correo de Google o el ID del calendario secundario para leer su disponibilidad.</p>
            <input
              value={formData.google_calendar_id}
              onChange={(e) => setFormData({ ...formData, google_calendar_id: e.target.value })}
              className="w-full p-3 bg-navy-deep border border-border-subtle rounded-lg text-xs text-text-primary focus:border-accent-blue outline-none"
              placeholder="ej: nombre@gmail.com"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-text-secondary hover:text-text-primary transition-all">Cancelar</button>
            <button type="submit" className="px-8 py-3 bg-accent-blue text-white rounded-xl font-bold hover:bg-accent-hover shadow-lg shadow-accent-blue/20 transition-all">
              {initialData ? 'Guardar Cambios' : 'Crear Profesional'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const Professionals = () => {
  const [professionals, setProfessionals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingProfessional, setEditingProfessional] = React.useState<any>(null);

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

  const handleSave = async (data: any) => {
    try {
      setLoading(true);
      if (editingProfessional) {
        await dbService.updateDocument('professionals', editingProfessional.id, data);
      } else {
        await dbService.addDocument('professionals', data);
      }
      setModalOpen(false);
      setEditingProfessional(null);
      fetchProfessionals();
    } catch (error) {
      console.error('Error saving professional:', error);
      alert('Error al guardar profesional.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-text-primary tracking-tight">Equipo Médico</h3>
        <button
          onClick={() => { setEditingProfessional(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-xl font-bold hover:bg-accent-hover shadow-lg shadow-accent-blue/20 transition-all"
        >
          <Plus size={18} />
          Nuevo Profesional
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-navy-main/20 backdrop-blur-[1px]">
            <Loader2 className="animate-spin text-accent-blue" size={32} />
          </div>
        )}

        {professionals.length > 0 ? (
          professionals.map((pro, i) => (
            <div key={pro.id} className="bg-navy-card p-6 rounded-2xl border border-border-subtle shadow-lg hover:shadow-xl transition-all group relative">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-navy-deep flex items-center justify-center text-text-primary group-hover:bg-accent-blue group-hover:text-white transition-all border border-border-subtle">
                  <User size={32} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest",
                    pro.type === 'internal' ? "bg-accent-blue/10 text-accent-blue" : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {pro.type === 'internal' ? 'Interno' : 'Externo'}
                  </span>
                  <button
                    onClick={() => { setEditingProfessional(pro); setModalOpen(true); }}
                    className="p-2 hover:bg-white/10 rounded-lg text-text-secondary transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h4 className="text-lg font-bold text-text-primary">{pro.name}</h4>
                <p className="text-sm text-accent-blue font-medium">{pro.specialty}</p>
              </div>

              <div className="space-y-3 pt-6 border-t border-border-subtle">
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <Mail size={16} className="text-text-secondary/40" />
                  <span className="truncate">{pro.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <Calendar size={16} className={pro.google_calendar_id ? "text-emerald-500" : "text-text-secondary/40"} />
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    pro.google_calendar_id ? "text-emerald-500" : "text-text-secondary/50"
                  )}>
                    {pro.google_calendar_id ? "Sincronizado" : "Sin Sincronizar"}
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

      <ProfessionalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editingProfessional}
      />
    </div>
  );
};
