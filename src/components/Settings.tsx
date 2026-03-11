import React from 'react';
import { 
  Save, 
  Calendar, 
  Bell, 
  Shield, 
  MapPin, 
  Clock,
  Plus,
  Trash2,
  Settings as SettingsIcon,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { dbService } from '../services/dbService';

export const Settings = () => {
  const [faqs, setFaqs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const data = await dbService.getFAQs();
      setFaqs(data);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      {/* Google Calendar Integration */}
      <section className="bg-navy-card p-8 rounded-3xl border border-border-subtle shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-accent-blue text-white rounded-2xl shadow-lg shadow-accent-blue/20">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary tracking-tight">Integración Google Calendar</h3>
            <p className="text-sm text-text-secondary">Sincroniza las citas con los calendarios de los profesionales.</p>
          </div>
        </div>
        
        <div className="p-6 bg-navy-deep/50 rounded-2xl border border-dashed border-border-subtle flex flex-col items-center justify-center text-center">
          <p className="text-text-secondary mb-4 font-medium">Conecta la cuenta principal de la clínica para gestionar los calendarios.</p>
          <button className="px-8 py-3 bg-navy-card border border-border-subtle rounded-xl text-text-primary font-bold shadow-sm hover:bg-white/5 transition-all flex items-center gap-3">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Conectar drgio@440clinic.com
          </button>
        </div>
      </section>

      {/* WhatsApp Agent Knowledge Base */}
      <section className="bg-navy-card p-8 rounded-3xl border border-border-subtle shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Base de Conocimiento WhatsApp</h3>
              <p className="text-sm text-text-secondary">Configura las respuestas automáticas para el agente de pacientes.</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-xl text-sm font-bold hover:bg-accent-hover transition-all">
            <Plus size={16} />
            Añadir FAQ
          </button>
        </div>

        <div className="space-y-4">
          {faqs.length === 0 ? (
            <div className="p-8 text-center bg-navy-deep/30 rounded-2xl border border-dashed border-border-subtle">
              <HelpCircle size={32} className="mx-auto mb-3 text-text-secondary/20" />
              <p className="text-sm text-text-secondary/40 font-medium">No hay preguntas frecuentes configuradas aún.</p>
            </div>
          ) : (
            faqs.map((faq) => (
              <div key={faq.id} className="p-6 bg-navy-deep/50 rounded-2xl border border-border-subtle group">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 bg-accent-blue/10 text-accent-blue text-[9px] font-bold uppercase tracking-widest rounded-md">{faq.category}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                      <SettingsIcon size={14} />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-text-primary mb-2">{faq.question}</h4>
                <p className="text-sm text-text-secondary leading-relaxed">{faq.answer}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Appointment Types */}
      <section className="bg-navy-card p-8 rounded-3xl border border-border-subtle shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent-blue text-white rounded-2xl shadow-lg shadow-accent-blue/20">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Tipos de Cita</h3>
              <p className="text-sm text-text-secondary">Configura duraciones y requisitos por defecto.</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-xl text-sm font-bold hover:bg-accent-hover transition-all">
            <Plus size={16} />
            Añadir Tipo
          </button>
        </div>

        <div className="space-y-4">
          {[
            { name: 'Valoración Cirugía', duration: '60 min', color: 'bg-accent-blue' },
            { name: 'Control Postoperatorio', duration: '30 min', color: 'bg-emerald-500' },
            { name: 'Procedimiento Menor', duration: '90 min', color: 'bg-purple-500' },
            { name: 'Cámara Hiperbárica', duration: '60 min', color: 'bg-amber-500' },
          ].map((type, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-navy-deep/50 rounded-xl border border-border-subtle group">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${type.color}`} />
                <div>
                  <p className="font-bold text-text-primary">{type.name}</p>
                  <p className="text-xs text-text-secondary">{type.duration} • Requiere Recurso</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-text-primary">
                  <SettingsIcon size={16} />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-navy-card p-8 rounded-3xl border border-border-subtle shadow-lg">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-accent-blue text-white rounded-2xl shadow-lg shadow-accent-blue/20">
            <Bell size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary tracking-tight">Notificaciones Automáticas</h3>
            <p className="text-sm text-text-secondary">Gestiona el envío de correos y recordatorios.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-text-primary">Confirmación de Cita</p>
              <p className="text-xs text-text-secondary">Enviar correo al crear una nueva cita.</p>
            </div>
            <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-text-primary">Recordatorio 24h</p>
              <p className="text-xs text-text-secondary">Enviar recordatorio automático un día antes.</p>
            </div>
            <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button className="flex items-center gap-2 px-8 py-4 bg-accent-blue text-white rounded-2xl font-bold hover:bg-accent-hover shadow-lg shadow-accent-blue/20 transition-all">
          <Save size={20} />
          Guardar Configuración
        </button>
      </div>
    </div>
  );
};
