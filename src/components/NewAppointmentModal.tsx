import React from 'react';
import { X, Calendar, Clock, User, FileText, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Seleccione un paciente'),
  professional_id: z.string().min(1, 'Seleccione un profesional'),
  type_id: z.string().min(1, 'Seleccione tipo de cita'),
  date: z.string().min(1, 'Seleccione fecha'),
  time: z.string().min(1, 'Seleccione hora'),
  observations: z.string().optional(),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AppointmentForm) => void;
}

export const NewAppointmentModal = ({ isOpen, onClose, onSave }: Props) => {
  const { register, handleSubmit, formState: { errors } } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-beige-dark"
        >
          {/* Header */}
          <div className="p-6 border-b border-beige-dark flex items-center justify-between bg-beige-light/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-terracota text-white rounded-xl">
                <Calendar size={20} />
              </div>
              <h2 className="text-xl font-serif font-bold text-navy-deep">Nueva Cita</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-beige-dark rounded-full transition-all text-navy-deep/40 hover:text-navy-deep"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSave)} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-navy-deep/50 flex items-center gap-2">
                  <User size={12} /> Paciente
                </label>
                <div className="relative">
                  <select 
                    {...register('patient_id')}
                    className="w-full p-4 bg-beige-light border border-beige-dark rounded-2xl text-navy-deep font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-terracota/20 transition-all"
                  >
                    <option value="">Seleccionar paciente...</option>
                    <option value="1">María García</option>
                    <option value="2">Juan Pérez</option>
                    <option value="3">Ana Martínez</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-deep/30 pointer-events-none" />
                </div>
                {errors.patient_id && <p className="text-xs text-terracota font-bold">{errors.patient_id.message}</p>}
              </div>

              {/* Professional Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-navy-deep/50 flex items-center gap-2">
                  <User size={12} /> Profesional
                </label>
                <div className="relative">
                  <select 
                    {...register('professional_id')}
                    className="w-full p-4 bg-beige-light border border-beige-dark rounded-2xl text-navy-deep font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-terracota/20 transition-all"
                  >
                    <option value="">Seleccionar profesional...</option>
                    <option value="1">Dr. Gio (Cirujano)</option>
                    <option value="2">Dra. Elena (Estética)</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-deep/30 pointer-events-none" />
                </div>
                {errors.professional_id && <p className="text-xs text-terracota font-bold">{errors.professional_id.message}</p>}
              </div>

              {/* Appointment Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-navy-deep/50 flex items-center gap-2">
                  <FileText size={12} /> Tipo de Cita
                </label>
                <div className="relative">
                  <select 
                    {...register('type_id')}
                    className="w-full p-4 bg-beige-light border border-beige-dark rounded-2xl text-navy-deep font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-terracota/20 transition-all"
                  >
                    <option value="">Seleccionar tipo...</option>
                    <option value="1">Valoración Cirugía (60 min)</option>
                    <option value="2">Control Postoperatorio (30 min)</option>
                    <option value="3">Procedimiento Menor (90 min)</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-deep/30 pointer-events-none" />
                </div>
                {errors.type_id && <p className="text-xs text-terracota font-bold">{errors.type_id.message}</p>}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-navy-deep/50 flex items-center gap-2">
                    <Calendar size={12} /> Fecha
                  </label>
                  <input 
                    type="date"
                    {...register('date')}
                    className="w-full p-4 bg-beige-light border border-beige-dark rounded-2xl text-navy-deep font-medium focus:outline-none focus:ring-2 focus:ring-terracota/20 transition-all"
                  />
                  {errors.date && <p className="text-xs text-terracota font-bold">{errors.date.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-navy-deep/50 flex items-center gap-2">
                    <Clock size={12} /> Hora
                  </label>
                  <input 
                    type="time"
                    {...register('time')}
                    className="w-full p-4 bg-beige-light border border-beige-dark rounded-2xl text-navy-deep font-medium focus:outline-none focus:ring-2 focus:ring-terracota/20 transition-all"
                  />
                  {errors.time && <p className="text-xs text-terracota font-bold">{errors.time.message}</p>}
                </div>
              </div>
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-navy-deep/50 flex items-center gap-2">
                <FileText size={12} /> Observaciones
              </label>
              <textarea 
                {...register('observations')}
                rows={3}
                placeholder="Notas adicionales..."
                className="w-full p-4 bg-beige-light border border-beige-dark rounded-2xl text-navy-deep font-medium focus:outline-none focus:ring-2 focus:ring-terracota/20 transition-all resize-none"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-8 py-4 text-navy-deep/50 font-bold hover:text-navy-deep transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-10 py-4 bg-navy-deep text-white rounded-2xl font-bold shadow-xl shadow-navy-deep/20 hover:bg-navy-light transition-all active:scale-[0.98]"
              >
                Guardar Cita
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
