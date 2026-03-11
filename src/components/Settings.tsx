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
  MessageSquare,
  Key,
  ExternalLink,
  Info,
  CheckCircle2,
  Users,
  UserPlus
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { supabase } from '../lib/supabase';

export const Settings = () => {
  const [faqs, setFaqs] = React.useState<any[]>([]);
  const [profiles, setProfiles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [apiKey, setApiKey] = React.useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [showKey, setShowKey] = React.useState(false);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [faqData, profileResp] = await Promise.all([
        dbService.getFAQs(),
        supabase.from('profiles').select('*').order('created_at', { ascending: false })
      ]);
      setFaqs(faqData);
      if (profileResp.data) setProfiles(profileResp.data);
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'reception' : 'admin';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p));
    } catch (error: any) {
      alert('Error actualizando rol: ' + error.message);
    }
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    alert('Configuración de IA guardada con éxito.');
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

      {/* AI Configuration */}
      <section className="bg-navy-card p-8 rounded-3xl border border-border-subtle shadow-lg">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-accent-blue text-white rounded-2xl shadow-lg shadow-accent-blue/20">
            <Key size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary tracking-tight">Configuración de Inteligencia Artificial</h3>
            <p className="text-sm text-text-secondary">Gestiona la conexión con Google Gemini para el Agente IA.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-navy-deep/50 rounded-2xl border border-border-subtle">
            <label className="block text-sm font-bold text-text-primary mb-2">Google Gemini API Key</label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-navy-card border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent-blue transition-colors pr-12"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showKey ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <button
                onClick={handleSaveApiKey}
                className="px-6 py-3 bg-accent-blue text-white rounded-xl font-bold hover:bg-accent-hover transition-all flex items-center gap-2"
              >
                <Save size={18} />
                Guardar llave
              </button>
            </div>
            <p className="mt-3 text-xs text-text-secondary flex items-center gap-2 italic">
              <Info size={12} />
              Esta llave permite al Agente IA recibir y procesar solicitudes clínicas. Manténgala segura.
            </p>
          </div>
        </div>
      </section>

      {/* User Management Section */}
      <section className="bg-navy-card p-10 rounded-[40px] border border-border-subtle shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-blue/5 blur-[100px] rounded-full -mr-40 -mt-40 group-hover:bg-accent-blue/10 transition-all duration-700" />

        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-accent-blue text-white rounded-[24px] shadow-2xl shadow-accent-blue/20">
              <Users size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-text-primary tracking-tight">Gestión de Usuarios</h3>
              <p className="text-sm text-text-secondary font-medium mt-1">Administra los accesos y roles de tu equipo clínico.</p>
            </div>
          </div>
          <a
            href="https://supabase.com/dashboard/project/wvkiqgcpccjcmafjhwzu/auth/users"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-navy-deep border border-border-subtle text-text-primary rounded-2xl text-sm font-bold hover:bg-white/5 transition-all shadow-sm"
          >
            <UserPlus size={18} />
            Invitar desde Supabase
          </a>
        </div>

        <div className="space-y-4 relative z-10">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex items-center justify-between p-6 bg-navy-deep/40 backdrop-blur-sm rounded-3xl border border-border-subtle hover:border-accent-blue/30 transition-all group/item shadow-inner">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-accent-blue/10 border border-accent-blue/20 rounded-2xl flex items-center justify-center text-accent-blue font-black text-xl shadow-lg">
                  {profile.name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-text-primary text-lg">{profile.name}</p>
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${profile.role === 'admin' ? 'bg-accent-blue text-white' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                      {profile.role === 'admin' ? 'Administrador' : 'Colaborador'}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary/60 font-medium mt-0.5">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleUserRole(profile.id, profile.role)}
                  className="px-6 py-3 bg-navy-card border border-border-subtle rounded-2xl text-xs font-black uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-accent-blue/50 transition-all shadow-lg"
                >
                  Cambiar a {profile.role === 'admin' ? 'Colaborador' : 'Administrador'}
                </button>
              </div>
            </div>
          ))}

          {profiles.length === 0 && (
            <div className="p-16 text-center bg-navy-deep/20 rounded-[40px] border border-dashed border-border-subtle border-2">
              <Users size={48} className="mx-auto mb-6 text-text-secondary/10" />
              <p className="text-lg font-bold text-text-secondary/40">No hay perfiles registrados en la base de datos.</p>
              <p className="text-sm text-text-secondary/20 mt-2 italic">Solo los usuarios registrados vía Supabase Auth aparecerán aquí.</p>
            </div>
          )}
        </div>

        <div className="mt-8 p-6 bg-accent-blue/5 rounded-3xl border border-accent-blue/10 flex items-start gap-4">
          <Info size={20} className="text-accent-blue mt-1 shrink-0" />
          <p className="text-xs text-text-secondary leading-relaxed font-medium">
            <strong>Instrucciones de Seguridad:</strong> Los usuarios deben crearse primero en el <strong>Dashboard de Supabase</strong> con su correo y contraseña. Una vez que inicien sesión por primera vez, aparecerán en esta lista para que el administrador les asigne el rol correspondiente. Los <strong>Colaboradores</strong> solo tienen acceso al Agente IA y al Calendario.
          </p>
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

      {/* Google Calendar Help Guide */}
      <section className="bg-navy-card p-8 rounded-3xl border border-border-subtle shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 blur-3xl rounded-full -mr-32 -mt-32" />

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-accent-blue text-white rounded-2xl shadow-lg shadow-accent-blue/20">
            <HelpCircle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary tracking-tight">Guía de Calendarios</h3>
            <p className="text-sm text-text-secondary">Cómo vincular correctamente Google Calendar.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-bold text-text-primary flex items-center gap-2">
              <CheckCircle2 size={16} className="text-accent-blue" />
              Para Profesionales
            </h4>
            <ol className="text-sm text-text-secondary space-y-3 pl-4">
              <li>1. Ve a la sección <strong>Profesionales</strong>.</li>
              <li>2. Haz clic en Editar (o crear nuevo).</li>
              <li>3. En el campo <strong>Google Calendar ID</strong>, pega el correo del profesional (ej: sharon@440clinic.com) o el ID del calendario secundario.</li>
              <li>4. El Agente IA ahora podrá leer su disponibilidad.</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-text-primary flex items-center gap-2">
              <CheckCircle2 size={16} className="text-accent-blue" />
              Para Recursos (Salas/Cámaras)
            </h4>
            <ol className="text-sm text-text-secondary space-y-3 pl-4">
              <li>1. Ve a la sección <strong>Recursos</strong>.</li>
              <li>2. En el campo <strong>Calendar ID</strong>, usa el ID del recurso de Google Workspace (ej: resource_id@resource.calendar.google.com).</li>
              <li>3. La app bloqueará automáticamente este recurso en Google cuando se agende una cita que lo requiera.</li>
            </ol>
          </div>
        </div>

        <div className="mt-8 p-4 bg-accent-blue/5 rounded-xl border border-accent-blue/10">
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong>Nota Técnica:</strong> Todas las sincronizaciones ocurren inicialmente a través de la cuenta <code>drgio@440clinic.com</code>. Asegúrese de que esta cuenta tenga permisos de "Hacer cambios y administrar el uso compartido" en los calendarios individuales de los profesionales.
          </p>
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
