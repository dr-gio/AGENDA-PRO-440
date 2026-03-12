import React from 'react';
import {
  Plus,
  Box,
  Circle,
  Clock,
  Settings,
  X,
  Loader2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { dbService } from '../services/dbService';

// --- Resource Modal ---
const ResourceModal = ({
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
    type: '',
    calendar_id: '',
    status: 'active'
  });

  React.useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData({ name: '', type: '', calendar_id: '', status: 'active' });
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
          <h3 className="text-xl font-bold text-text-primary capitalize">{initialData ? 'Editar Recurso' : 'Nuevo Recurso'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-text-secondary"><X size={20} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Nombre del Recurso</label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-4 bg-navy-deep border border-border-subtle rounded-xl text-text-primary focus:border-accent-blue outline-none transition-all"
              placeholder="Ej: Cámara Hiperbárica 1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Tipo / Categoría</label>
            <input
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-4 bg-navy-deep border border-border-subtle rounded-xl text-text-primary focus:border-accent-blue outline-none transition-all"
              placeholder="Ej: Equipo Especial, Consultorio"
            />
          </div>

          <div className="p-4 bg-accent-blue/5 rounded-2xl border border-accent-blue/20 space-y-3">
            <div className="flex items-center gap-2 text-accent-blue">
              <Calendar size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Google Calendar Resources</span>
            </div>
            <p className="text-[10px] text-text-secondary leading-relaxed font-medium">Usa el ID del calendario de recurso de Google (ej: resource_id@resource.calendar.google.com)</p>
            <input
              value={formData.calendar_id}
              onChange={(e) => setFormData({ ...formData, calendar_id: e.target.value })}
              className="w-full p-3 bg-navy-deep border border-border-subtle rounded-lg text-xs text-text-primary focus:border-accent-blue outline-none"
              placeholder="ej: resource@resource.calendar.google.com"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-text-secondary hover:text-text-primary transition-all">Cancelar</button>
            <button type="submit" className="px-8 py-3 bg-accent-blue text-white rounded-xl font-bold hover:bg-accent-hover shadow-lg shadow-accent-blue/20 transition-all">
              {initialData ? 'Guardar Cambios' : 'Crear Recurso'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const Resources = () => {
  const [resources, setResources] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingResource, setEditingResource] = React.useState<any>(null);

  React.useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await dbService.getCollection('resources');
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      setLoading(true);
      if (editingResource) {
        await dbService.updateDocument('resources', editingResource.id, data);
      } else {
        await dbService.addDocument('resources', data);
      }
      setModalOpen(false);
      setEditingResource(null);
      fetchResources();
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('Error al guardar el recurso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-text-primary tracking-tight">Recursos Reservables</h3>
        <button
          onClick={() => { setEditingResource(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-xl font-bold hover:bg-accent-hover shadow-lg shadow-accent-blue/20 transition-all"
        >
          <Plus size={18} />
          Nuevo Recurso
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-navy-main/20 backdrop-blur-[1px]">
            <Loader2 className="animate-spin text-accent-blue" size={32} />
          </div>
        )}

        {resources.map((res, i) => (
          <div key={res.id || i} className="bg-navy-card p-6 rounded-2xl border border-border-subtle shadow-lg hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-navy-deep rounded-xl text-text-primary group-hover:bg-accent-blue group-hover:text-white transition-all border border-border-subtle">
                <Box size={24} />
              </div>
              <button
                onClick={() => { setEditingResource(res); setModalOpen(true); }}
                className="p-2 hover:bg-white/10 rounded-lg text-text-secondary transition-all"
              >
                <Settings size={18} />
              </button>
            </div>

            <div className="space-y-1 mb-6">
              <h4 className="font-bold text-text-primary">{res.name}</h4>
              <p className="text-[10px] text-accent-blue uppercase tracking-[0.2em] font-bold">{res.type}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-text-secondary/50">
                  <span>Conexión Google</span>
                  <span className={res.calendar_id ? "text-emerald-500" : ""}>
                    {res.calendar_id ? "Sincronizado" : "No vinculada"}
                  </span>
                </div>
                <div className="h-1 bg-navy-deep rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-1000", res.calendar_id ? "bg-emerald-500 w-full" : "bg-accent-blue w-0")}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  <Circle size={8} className={cn("fill-current", res.status === 'active' ? "text-emerald-500" : "text-gray-500")} />
                  <span>{res.status === 'active' ? 'Operativo' : 'Inactivo'}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-text-secondary/40">
                  <Clock size={12} />
                  <span>24/7</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && resources.length === 0 && (
          <div className="col-span-full py-12 text-center text-text-secondary/30 italic">
            No hay recursos registrados.
          </div>
        )}
      </div>

      <ResourceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editingResource}
      />
    </div>
  );
};
