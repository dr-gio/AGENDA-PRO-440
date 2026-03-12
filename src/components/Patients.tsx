import React from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  User,
  Phone,
  Mail,
  MapPin,
  Filter,
  Download,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { dbService } from '../services/dbService';
import { motion, AnimatePresence } from 'motion/react';

export const Patients = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [patients, setPatients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    full_name: '',
    document_type: 'CC',
    document_number: '',
    phone: '',
    email: '',
    city: ''
  });

  React.useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await dbService.getCollection('patients');
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await dbService.addDocument('patients', formData);
      setIsModalOpen(false);
      setFormData({
        full_name: '',
        document_type: 'CC',
        document_number: '',
        phone: '',
        email: '',
        city: ''
      });
      fetchPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Error al guardar el paciente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.document_number.includes(searchTerm) ||
    p.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, documento o celular..."
            className="w-full pl-12 pr-4 py-3 bg-navy-card border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all text-text-primary placeholder:text-text-secondary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-navy-card border border-border-subtle rounded-xl text-text-primary font-bold hover:bg-white/5 transition-all">
            <Filter size={18} />
            Filtrar
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-navy-card border border-border-subtle rounded-xl text-text-primary font-bold hover:bg-white/5 transition-all">
            <Download size={18} />
            Exportar
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-xl font-bold hover:bg-accent-hover shadow-lg shadow-accent-blue/20 transition-all"
          >
            <Plus size={18} />
            Nuevo Paciente
          </button>
        </div>
      </div>

      <div className="bg-navy-card rounded-2xl border border-border-subtle shadow-lg overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-navy-main/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-accent-blue" size={32} />
          </div>
        )}

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-subtle bg-navy-deep/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-secondary">Paciente</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-secondary">Documento</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-secondary">Contacto</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-secondary">Ciudad</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-text-secondary">Última Cita</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient, i) => (
                <tr key={patient.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-navy-deep flex items-center justify-center text-text-primary font-bold border border-border-subtle">
                        {patient.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-text-primary">{patient.full_name}</p>
                        <p className="text-xs text-text-secondary">ID: {patient.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-text-secondary">{patient.document_type} {patient.document_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <Phone size={12} />
                        <span>{patient.phone}</span>
                      </div>
                      {patient.email && (
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <Mail size={12} />
                          <span>{patient.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <MapPin size={14} />
                      <span>{patient.city || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-text-secondary">N/A</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-secondary/50 italic">
                  No se encontraron pacientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Patient Modal (Simplified) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-main/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-navy-card w-full max-w-lg rounded-3xl shadow-2xl p-8 border border-border-subtle"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-primary tracking-tight">Nuevo Paciente</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X size={20} className="text-text-secondary" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Nombre Completo</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full p-4 bg-navy-deep border border-border-subtle rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                    placeholder="Ej: María García"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Tipo Doc.</label>
                    <select
                      value={formData.document_type}
                      onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                      className="w-full p-4 bg-navy-deep border border-border-subtle rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                    >
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="TI">TI</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Número</label>
                    <input
                      type="text"
                      value={formData.document_number}
                      onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                      className="w-full p-4 bg-navy-deep border border-border-subtle rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-4 bg-navy-deep border border-border-subtle rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-4 bg-navy-deep border border-border-subtle rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 mt-8">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-text-secondary font-bold hover:text-text-primary transition-colors">Cancelar</button>
                <button
                  onClick={handleSave}
                  className="px-8 py-3 bg-accent-blue text-white rounded-xl font-bold shadow-lg shadow-accent-blue/20 hover:bg-accent-hover transition-all"
                >
                  Guardar Paciente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
