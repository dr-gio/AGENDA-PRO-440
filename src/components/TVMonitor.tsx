import React from 'react';
import {
    Monitor,
    Clock,
    ChevronLeft,
    ChevronRight,
    Stethoscope,
    Box,
    User,
    Video,
    Wind,
    Zap,
    Activity,
    Calendar,
    Filter,
    Bot,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { dbService } from '../services/dbService';
import { cn } from '../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColumnData {
    id: string;
    name: string;
    type: string;
    category: 'doctor' | 'resource';
    image?: string;
    icon: any;
    current?: any;
    upcoming: any[];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const MonitorColumn = ({ data }: { data: ColumnData }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col h-full min-w-[280px] bg-navy-card/30 border-x border-border-subtle/30 backdrop-blur-sm"
    >
        {/* Column Header */}
        <div className="p-6 flex flex-col items-center text-center gap-3 border-b border-border-subtle/50 bg-navy-deep/20">
            <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-accent-blue/30 shadow-2xl shadow-accent-blue/10 bg-navy-deep flex items-center justify-center">
                    {data.image ? (
                        <img src={data.image} alt={data.name} className="w-full h-full object-cover" />
                    ) : (
                        <data.icon size={32} className="text-accent-blue" />
                    )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 rounded-lg border-2 border-navy-deep flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
            </div>
            <div>
                <h4 className="text-base font-bold text-text-primary uppercase tracking-tight">{data.name}</h4>
                <p className="text-[10px] font-bold text-accent-blue uppercase tracking-[0.2em]">{data.type}</p>
            </div>
        </div>

        {/* LIVE Section */}
        <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Live</span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Ready</span>
            </div>

            {data.current ? (
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-accent-blue rounded-2xl shadow-lg border-l-4 border-white"
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-white uppercase">{data.current.start_time}</span>
                    </div>
                    <p className="text-sm font-bold text-white truncate">{data.current.patient_name || 'Paciente'}</p>
                    <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">{data.current.type_name || 'Control'}</p>
                </motion.div>
            ) : (
                <div className="h-24 flex items-center justify-center border border-dashed border-border-subtle rounded-2xl opacity-20">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Disponible</span>
                </div>
            )}
        </div>

        {/* PLAN Section */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between sticky top-0 bg-transparent z-10 py-1">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Plan</span>
            </div>

            <div className="space-y-3">
                {data.upcoming.length > 0 ? (
                    data.upcoming.map((appt, i) => (
                        <div key={i} className="p-3 bg-navy-deep/40 rounded-xl border border-border-subtle/50 group hover:border-accent-blue/50 transition-all">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-accent-blue">{appt.start_time}</span>
                                <Clock size={10} className="text-text-secondary" />
                            </div>
                            <p className="text-xs font-bold text-text-primary truncate group-hover:text-accent-blue transition-colors">
                                {appt.patient_name || 'Paciente'}
                            </p>
                            <p className="text-[9px] text-text-secondary font-medium uppercase tracking-wider">
                                {appt.type_name || 'Control'}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-[10px] text-text-secondary/30 italic text-center py-4">No hay más citas para hoy</p>
                )}
            </div>
        </div>
    </motion.div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const TVMonitor = () => {
    const [columns, setColumns] = React.useState<ColumnData[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState('all');
    const [time, setTime] = React.useState(new Date());

    React.useEffect(() => {
        fetchOperationalData();
        const interval = setInterval(() => setTime(new Date()), 1000);

        // Subscribe to all changes
        const sub = dbService.subscribeToTable('appointments', () => fetchOperationalData());

        return () => {
            clearInterval(interval);
            sub.unsubscribe();
        };
    }, []);

    const fetchOperationalData = async () => {
        try {
            setLoading(true);
            const today = format(new Date(), 'yyyy-MM-dd');

            // Fetch all required data
            const [profs, res, appts] = await Promise.all([
                dbService.getCollection('professionals', { status: 'active' }),
                dbService.getCollection('resources', { status: 'active' }),
                dbService.getCollection('appointments', { appointment_date: today })
            ]);

            // Fetch patients for names (in a real app, do this via a join or optimized query)
            const patients = await dbService.getCollection('patients');
            const types = await dbService.getCollection('appointment_types');

            const apptWithDetails = appts.map((a: any) => ({
                ...a,
                patient_name: patients.find(p => p.id === a.patient_id)?.full_name,
                type_name: types.find(t => t.id === a.type_id)?.name
            }));

            const currentTimeStr = format(new Date(), 'HH:mm');

            // Map professionals to columns
            const profColumns = profs.map((p: any) => {
                const pAppts = apptWithDetails
                    .filter(a => a.professional_id === p.id)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time));

                return {
                    id: p.id,
                    name: p.name,
                    type: 'Especialista',
                    category: 'doctor',
                    icon: Stethoscope,
                    current: pAppts.find(a => a.start_time <= currentTimeStr && a.end_time >= currentTimeStr && a.status !== 'cancelled'),
                    upcoming: pAppts.filter(a => a.start_time > currentTimeStr && a.status !== 'cancelled')
                };
            });

            // Map resources to columns
            const resColumns = res.map((r: any) => {
                const rAppts = apptWithDetails
                    .filter(a => a.resource_id === r.id)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time));

                const iconMap: any = {
                    'Cámara': Wind,
                    'Láser': Zap,
                    'Sala': Box,
                    'Audiovisual': Video,
                };

                return {
                    id: r.id,
                    name: r.name,
                    type: 'Sala / Recurso',
                    category: 'resource',
                    icon: iconMap[(r.name || '').split(' ')[0]] || Box,
                    current: rAppts.find(a => a.start_time <= currentTimeStr && a.end_time >= currentTimeStr && a.status !== 'cancelled'),
                    upcoming: rAppts.filter(a => a.start_time > currentTimeStr && a.status !== 'cancelled')
                };
            });

            setColumns([...profColumns, ...resColumns] as ColumnData[]);
        } catch (error) {
            console.error('TV Monitor fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredColumns = columns.filter(c => {
        if (filter === 'all') return true;
        if (filter === 'doctors') return c.category === 'doctor';
        if (filter === 'resources') return c.category === 'resource';
        return true;
    });

    return (
        <div className="fixed inset-0 bg-navy-main z-[100] flex flex-col overflow-hidden text-text-primary">
            {/* Top Header Bar */}
            <header className="h-20 bg-navy-deep border-b border-border-subtle flex items-center justify-between px-8 shadow-2xl z-20">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                            <span className="text-white">440</span>
                            <span className="text-accent-blue font-light">clinic</span>
                            <span className="ml-2 px-3 py-1 bg-accent-blue/10 text-accent-blue text-[10px] font-bold uppercase tracking-[0.3em] rounded-lg border border-accent-blue/20">
                                Monitor Operativo
                            </span>
                        </h1>
                        <p className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-0.5">Sistema de Gestión en Tiempo Real</p>
                    </div>
                </div>

                <div className="flex items-center gap-8 bg-navy-main/50 px-6 py-2 rounded-2xl border border-border-subtle">
                    <div className="flex items-center gap-4 text-text-secondary border-r border-border-subtle pr-8">
                        <button className="p-2 hover:bg-white/5 rounded-xl transition-all"><ChevronLeft size={20} /></button>
                        <div className="text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Fecha</p>
                            <p className="text-sm font-bold text-white uppercase">{format(new Date(), 'EEEE, d MMMM', { locale: es })}</p>
                        </div>
                        <button className="p-2 hover:bg-white/5 rounded-xl transition-all"><ChevronRight size={20} /></button>
                    </div>

                    <div className="flex items-center gap-4 pl-2">
                        <Clock size={24} className="text-accent-blue" />
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-white leading-none font-mono">
                                {format(time, 'HH:mm:ss')}
                            </span>
                            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Hora Local</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Filters */}
                <aside className="w-[280px] bg-navy-deep/50 border-r border-border-subtle p-8 flex flex-col gap-8 z-10 overflow-y-auto no-scrollbar">
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Modo de Vista</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="px-4 py-3 bg-accent-blue text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-accent-blue/20 border border-accent-blue/30 transition-all">Diaria</button>
                            <button className="px-4 py-3 bg-navy-card/50 text-text-secondary rounded-xl text-[10px] font-bold uppercase tracking-widest border border-border-subtle hover:bg-navy-card transition-all">Semanal</button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Filtrar Vista</p>
                        {[
                            { id: 'all', label: 'Todo la Clínica', icon: Activity },
                            { id: 'doctors', label: 'Solo Doctores', icon: Stethoscope },
                            { id: 'resources', label: 'Salas y Equipos', icon: Zap },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setFilter(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all border",
                                    filter === item.id
                                        ? "bg-accent-blue text-white shadow-xl shadow-accent-blue/10 border-accent-blue/50"
                                        : "bg-navy-main/30 text-text-secondary border-transparent hover:bg-navy-main/50 hover:border-border-subtle"
                                )}
                            >
                                <item.icon size={16} />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto space-y-4">
                        <div className="p-5 bg-accent-blue/5 rounded-3xl border border-accent-blue/20 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-3 text-accent-blue">
                                    <Bot size={18} className="animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Análisis IA</span>
                                </div>
                                <p className="text-xs text-text-primary/70 leading-relaxed font-medium">Operación estable. 7 citas completadas. 3 recursos con alta demanda hoy.</p>
                            </div>
                            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-accent-blue/5 rounded-full blur-2xl" />
                        </div>

                        <div className="p-5 bg-red-500/5 rounded-3xl border border-red-500/20">
                            <div className="flex items-center gap-3 mb-3 text-red-500">
                                <AlertCircle size={18} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Alertas</span>
                            </div>
                            <p className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest">Sin Conflictos</p>
                        </div>
                    </div>
                </aside>

                {/* Main Grid Display */}
                <main className="flex-1 overflow-x-auto overflow-y-hidden bg-navy-main flex divide-x divide-border-subtle/20 no-scrollbar">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-16 h-16 border-4 border-accent-blue border-t-transparent rounded-full animate-spin shadow-2xl shadow-accent-blue/20" />
                                <p className="text-xs font-bold text-accent-blue uppercase tracking-[0.4em] animate-pulse">Sincronizando Sistema</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {filteredColumns.map((col) => (
                                <MonitorColumn key={col.id} data={col} />
                            ))}

                            {/* Extra placeholder columns to fill space if few items */}
                            {filteredColumns.length < 5 && Array.from({ length: 5 - filteredColumns.length }).map((_, i) => (
                                <div key={`empty-${i}`} className="min-w-[280px] border-x border-border-subtle/10 bg-navy-deep/5" />
                            ))}
                        </>
                    )}
                </main>
            </div>

            {/* Bottom Status Bar */}
            <footer className="h-10 bg-navy-deep border-t border-border-subtle flex items-center justify-between px-8 text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em]">
                <div className="flex gap-6">
                    <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        Conectado: drgio@440clinic.com
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent-blue rounded-full" />
                        Sync Supabase Actualizado
                    </span>
                </div>
                <div className="flex gap-4">
                    <span>{filteredColumns.length} Recursos Activos</span>
                    <span className="text-accent-blue">440 Clinic · Monitor de Operación v2.0</span>
                </div>
            </footer>
        </div>
    );
};
