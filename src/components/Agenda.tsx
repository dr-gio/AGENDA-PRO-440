import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { NewAppointmentModal } from './NewAppointmentModal';
import { dbService, CreateAppointmentPayload } from '../services/dbService';
import { createGoogleCalendarEvent, CLINIC_CALENDAR_ID } from '../services/googleCalendarService';

export const Agenda = ({ userId = 'anonymous', userRole = 'reception' }: { userId?: string, userRole?: string }) => {
  const isAdmin = userRole === 'admin';
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<'day' | 'week' | 'month'>('week');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, 6)
  });

  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  React.useEffect(() => {
    fetchAppointments();

    // Subscribe to changes
    const subscription = dbService.subscribeToTable('appointments', () => {
      fetchAppointments();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // In a real app, we would filter by date range
      const data = await dbService.getCollection('appointments');
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppointment = async (data: any) => {
    try {
      setLoading(true);
      const startTime = data.time;

      // Compute default endTime (+1 hour)
      const startTimeStr = startTime || '08:00';
      const [h, m] = startTimeStr.split(':').map(Number);
      const endH = (h + 1).toString().padStart(2, '0');
      const endTime = data.end_time || `${endH}:${m.toString().padStart(2, '0')}`;

      // 0. Get patient email
      const patient = await dbService.getDocument('patients', data.patient_id);

      // 1. Create in Supabase with audit fields
      const payload: CreateAppointmentPayload = {
        patient_id: data.patient_id,
        professional_id: data.professional_id,
        type_id: data.type_id,
        appointment_date: data.date,
        start_time: startTime,
        end_time: endTime,
        observations: data.observations,
        status: 'pending',
        created_by_user: userId,
        source_of_booking: 'manual',
      };

      const newAppt = await dbService.createAppointment(payload);

      // 2. Sync to Google Calendar
      const syncResult = await createGoogleCalendarEvent(
        {
          id: newAppt.id,
          appointment_date: data.date,
          start_time: startTime,
          end_time: endTime,
          patient_id: data.patient_id,
          professional_id: data.professional_id,
          observations: data.observations,
          status: 'pending',
        },
        CLINIC_CALENDAR_ID,
        undefined,
        patient.email
      );

      // 3. Update Sync Status
      await dbService.updateSyncStatus(newAppt.id, syncResult);

      // 4. Record History
      await dbService.recordHistory({
        appointment_id: newAppt.id,
        changed_by: userId,
        change_type: 'created',
        new_data: newAppt,
        notes: `Cita creada manualmente. GCal sync: ${syncResult.success ? '✅' : '❌ pendiente'}`,
      });

      setIsModalOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Error al guardar la cita. Verifique la conexión con Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Agenda Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-navy-card p-4 rounded-2xl border border-border-subtle shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-navy-deep rounded-xl p-1 border border-border-subtle">
            <button
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="p-2 hover:bg-white/5 rounded-lg transition-all text-text-secondary hover:text-text-primary"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-bold text-text-primary hover:bg-white/5 rounded-lg transition-all"
            >
              Hoy
            </button>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="p-2 hover:bg-white/5 rounded-lg transition-all text-text-secondary hover:text-text-primary"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <h3 className="text-xl font-bold text-text-primary tracking-tight">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-navy-deep rounded-xl p-1 border border-border-subtle">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                  view === v ? "bg-accent-blue text-white shadow-lg shadow-accent-blue/20" : "text-text-secondary hover:text-text-primary"
                )}
              >
                {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
          <button className="p-3 bg-navy-card border border-border-subtle rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all">
            <Filter size={20} />
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-xl font-bold hover:bg-accent-hover shadow-lg shadow-accent-blue/20 transition-all"
            >
              <Plus size={18} />
              Nueva Cita
            </button>
          )}
        </div>
      </div>

      {/* Week View Grid */}
      <div className="bg-navy-card rounded-3xl border border-border-subtle shadow-2xl overflow-hidden flex flex-col h-[700px] relative">
        {loading && (
          <div className="absolute inset-0 bg-navy-main/50 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-accent-blue" size={32} />
          </div>
        )}

        {/* Days Header */}
        <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-border-subtle bg-navy-deep/50">
          <div className="p-4 border-r border-border-subtle"></div>
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={cn(
                "p-4 text-center border-r border-border-subtle last:border-r-0",
                isSameDay(day, new Date()) && "bg-accent-blue/5"
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary mb-1">
                {format(day, 'eee', { locale: es })}
              </p>
              <p className={cn(
                "text-lg font-bold",
                isSameDay(day, new Date()) ? "text-accent-blue" : "text-text-primary"
              )}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] relative">
            {/* Time Labels */}
            <div className="flex flex-col">
              {timeSlots.map((hour) => (
                <div key={hour} className="h-20 border-r border-b border-border-subtle flex items-start justify-center pt-2">
                  <span className="text-[10px] font-bold text-text-secondary/50">{hour}:00</span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="relative border-r border-border-subtle last:border-r-0">
                {timeSlots.map((hour) => (
                  <div key={hour} className="h-20 border-b border-border-subtle/30" />
                ))}

                {/* Render Appointments from DB */}
                {appointments
                  .filter(app => isSameDay(parseISO(app.appointment_date), day))
                  .map((app, i) => {
                    const timeStr = app.start_time || '08:00';
                    const [hPart, mPart] = timeStr.split(':');
                    const startHour = parseInt(hPart);
                    const startMin = parseInt(mPart);
                    const top = (startHour - 7) * 80 + (startMin / 60) * 80;

                    return (
                      <div
                        key={app.id}
                        style={{ top: `${top}px` }}
                        className="absolute left-1 right-1 h-20 bg-accent-blue text-white p-3 rounded-xl shadow-lg z-10 border-l-4 border-white group cursor-pointer hover:scale-[1.02] transition-all"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                            {app.start_time}
                          </p>
                          <MoreHorizontal size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs font-bold truncate">Paciente ID: {app.patient_id}</p>
                        <p className="text-[10px] opacity-80 truncate">Cita Médica</p>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <NewAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAppointment}
      />
    </div>
  );
};
