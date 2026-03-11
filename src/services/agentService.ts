/**
 * Internal AI Agent Service — Agenda Clínica 440
 *
 * This is the ONLY conversational AI in this app.
 * It is exclusively for AUTHENTICATED clinic staff.
 *
 * CAPABILITIES:
 *   - Agendar citas
 *   - Reprogramar citas
 *   - Cancelar citas
 *   - Confirmar citas
 *   - Consultar disponibilidad
 *   - Buscar pacientes
 *
 * EVERY ACTION:
 *   1. Validates data via dbService (patients, professionals, availability)
 *   2. Creates/modifies the appointment in Supabase with audit fields
 *   3. Syncs immediately with Google Calendar (drgio@440clinic.com)
 *   4. Records the action in agent_logs (audit trail)
 *   5. Records in appointment_history
 *
 * Google Calendar → GoHighLevel then handles reminders/WhatsApp automations.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { dbService } from './dbService';
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  cancelGoogleCalendarEvent,
  CLINIC_CALENDAR_ID,
} from './googleCalendarService';

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const agentTools = [
  {
    functionDeclarations: [
      {
        name: 'searchPatient',
        description: 'Busca un paciente por nombre en la base de datos de la clínica.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Nombre completo o parcial del paciente.' },
          },
          required: ['name'],
        },
      },
      {
        name: 'searchProfessional',
        description: 'Busca un profesional (médico/especialista) por nombre. Ejemplo: "Gio", "Sharon".',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Nombre del profesional.' },
          },
          required: ['name'],
        },
      },
      {
        name: 'searchResource',
        description: 'Busca un recurso reservable (cámara hiperbárica, consultorio, equipo).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Nombre del recurso.' },
          },
          required: ['name'],
        },
      },
      {
        name: 'checkAvailability',
        description: 'Verifica si un profesional tiene disponibilidad en una fecha y hora específica.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            professionalId: { type: Type.STRING, description: 'UUID del profesional.' },
            date: { type: Type.STRING, description: 'Fecha en formato YYYY-MM-DD.' },
            time: { type: Type.STRING, description: 'Hora en formato HH:MM.' },
          },
          required: ['professionalId', 'date', 'time'],
        },
      },
      {
        name: 'createAppointment',
        description: 'Crea una nueva cita. Sincroniza automáticamente con Google Calendar.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            patientId: { type: Type.STRING, description: 'UUID del paciente.' },
            professionalId: { type: Type.STRING, description: 'UUID del profesional.' },
            typeId: { type: Type.STRING, description: 'UUID del tipo de cita (opcional).' },
            date: { type: Type.STRING, description: 'Fecha en formato YYYY-MM-DD.' },
            time: { type: Type.STRING, description: 'Hora de inicio en formato HH:MM.' },
            endTime: { type: Type.STRING, description: 'Hora de fin en formato HH:MM (si no se da, se suma 1 hora).' },
            observations: { type: Type.STRING, description: 'Notas u observaciones adicionales.' },
          },
          required: ['patientId', 'professionalId', 'date', 'time'],
        },
      },
      {
        name: 'rescheduleAppointment',
        description: 'Reprograma una cita existente a nueva fecha y/u hora. Actualiza Google Calendar.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            appointmentId: { type: Type.STRING, description: 'UUID de la cita a reprogramar.' },
            newDate: { type: Type.STRING, description: 'Nueva fecha YYYY-MM-DD.' },
            newTime: { type: Type.STRING, description: 'Nueva hora de inicio HH:MM.' },
            newEndTime: { type: Type.STRING, description: 'Nueva hora de fin HH:MM (opcional).' },
          },
          required: ['appointmentId', 'newDate', 'newTime'],
        },
      },
      {
        name: 'cancelAppointment',
        description: 'Cancela una cita. La elimina de Google Calendar para detener workflows de GoHighLevel.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            appointmentId: { type: Type.STRING, description: 'UUID de la cita a cancelar.' },
            reason: { type: Type.STRING, description: 'Razón de la cancelación (opcional).' },
          },
          required: ['appointmentId'],
        },
      },
      {
        name: 'confirmAppointment',
        description: 'Confirma una cita pendiente. Actualiza el estado en Google Calendar.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            appointmentId: { type: Type.STRING, description: 'UUID de la cita a confirmar.' },
          },
          required: ['appointmentId'],
        },
      },
      {
        name: 'getAppointments',
        description: 'Consulta las citas existentes, filtrando por profesional o fecha.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            professionalId: { type: Type.STRING, description: 'UUID del profesional (opcional).' },
            date: { type: Type.STRING, description: 'Fecha específica YYYY-MM-DD (opcional).' },
            status: { type: Type.STRING, description: 'Estado de la cita (opcional): pending, confirmed, etc.' },
          },
        },
      },
    ],
  },
];

// ─── System Prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(userId: string, today: string): string {
  return `Eres el Agente Interno de Inteligencia Artificial de 440 Clinic by Dr. Gio.

CONTEXTO:
- Fecha de hoy: ${today}
- Usuario autenticado: ${userId}
- Calendario principal de la clínica: drgio@440clinic.com

TU ROL:
Asistes EXCLUSIVAMENTE al personal AUTENTICADO de la clínica (recepción, coordinación, médicos, asistentes).
NO eres un bot de WhatsApp ni un agente de pacientes externos.

CAPACIDADES:
1. Agendar citas nuevas
2. Reprogramar citas existentes  
3. Cancelar citas (detiene automatizaciones en GoHighLevel)
4. Confirmar citas pendientes
5. Consultar disponibilidad de profesionales
6. Buscar pacientes por nombre

FLUJO OBLIGATORIO para cada acción:
1. Identifica paciente y profesional usando las herramientas de búsqueda.
2. Si falta información (fecha, hora, paciente), PREGUNTA antes de actuar.
3. Verifica disponibilidad antes de crear una cita.
4. Ejecuta la acción (create/reschedule/cancel/confirm).
5. La app sincronizará automáticamente con Google Calendar.
6. GoHighLevel captará el cambio de Google Calendar para sus automatizaciones.

REGLAS CRÍTICAS:
- Si el usuario dice "Dr. Gio", busca al profesional "Gio".
- Si mencionan "cámara hiperbárica", usa searchResource.
- Si falta la hora o la fecha, SIEMPRE pregunta antes de actuar.
- Sé breve y profesional. Confirma siempre el resultado de la acción.
- Toda acción queda registrada con trazabilidad del usuario ${userId}.`;
}

// ─── Helper: compute endTime if not provided ─────────────────────────────────

function computeEndTime(startTime: string, durationMinutes = 60): string {
  const [hStr, mStr] = startTime.split(':');
  const totalMinutes = parseInt(hStr) * 60 + parseInt(mStr) + durationMinutes;
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ─── Agent Service ────────────────────────────────────────────────────────────

export const agentService = {
  async processMessage(message: string, userId: string): Promise<string> {
    // Guard: require Gemini API key
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
    if (!apiKey) {
      return 'El Agente IA no está disponible: falta la configuración de GEMINI_API_KEY en el entorno.';
    }

    const ai = new GoogleGenAI({ apiKey });
    const today = new Date().toISOString().split('T')[0];

    const chat = ai.chats.create({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction: buildSystemPrompt(userId, today),
        tools: agentTools,
      },
    });

    try {
      const result = await chat.sendMessage({ message });
      const functionCalls = result.functionCalls;

      if (!functionCalls || functionCalls.length === 0) {
        return result.text || 'No pude procesar tu solicitud. Por favor intenta de nuevo.';
      }

      // Process each function call
      const toolOutputs: Array<{ callId: string; output: any }> = [];

      for (const call of functionCalls) {
        let functionResult: any = null;
        let appointmentId: string | undefined;
        let gcalSyncAttempted = false;
        let gcalSyncSuccess = false;

        try {
          switch (call.name) {

            case 'searchPatient':
              functionResult = await dbService.searchPatient(call.args.name as string);
              break;

            case 'searchProfessional':
              functionResult = await dbService.searchProfessional(call.args.name as string);
              break;

            case 'searchResource':
              functionResult = await dbService.searchResource(call.args.name as string);
              break;

            case 'checkAvailability':
              functionResult = await dbService.checkAvailability(
                call.args.professionalId as string,
                call.args.date as string,
                call.args.time as string
              );
              break;

            case 'getAppointments': {
              const filters: Record<string, any> = {};
              if (call.args.professionalId) filters.professional_id = call.args.professionalId;
              if (call.args.date) filters.appointment_date = call.args.date;
              if (call.args.status) filters.status = call.args.status;
              functionResult = await dbService.getCollection('appointments', filters);
              break;
            }

            case 'createAppointment': {
              const startTime = call.args.time as string;
              const endTime = (call.args.endTime as string) || computeEndTime(startTime, 60);

              // 0. Get patient email
              const patient = await dbService.getDocument('patients', call.args.patientId as string);

              // 1. Create in Supabase with audit fields
              const newAppt = await dbService.createAppointment({
                patient_id: call.args.patientId as string,
                professional_id: call.args.professionalId as string,
                type_id: call.args.typeId as string | undefined,
                appointment_date: call.args.date as string,
                start_time: startTime,
                end_time: endTime,
                observations: call.args.observations as string | undefined,
                status: 'pending',
                created_by_user: userId,
                source_of_booking: 'internal_agent',
                sync_status: 'pending',
              });

              appointmentId = newAppt.id;

              // 2. Sync to Google Calendar  
              gcalSyncAttempted = true;
              const createSync = await createGoogleCalendarEvent(
                {
                  id: newAppt.id,
                  appointment_date: call.args.date as string,
                  start_time: startTime,
                  end_time: endTime,
                  patient_id: call.args.patientId as string,
                  professional_id: call.args.professionalId as string,
                  observations: call.args.observations as string | undefined,
                  status: 'pending',
                },
                CLINIC_CALENDAR_ID,
                undefined,
                patient.email
              );

              gcalSyncSuccess = createSync.success;

              // 3. Update sync status in DB
              await dbService.updateSyncStatus(newAppt.id, createSync);

              // 4. Record history
              await dbService.recordHistory({
                appointment_id: newAppt.id,
                changed_by: userId,
                change_type: 'created',
                new_data: newAppt,
                notes: `Agendada por agente IA. GCal sync: ${createSync.success ? '✅' : '❌ pendiente'}`,
              });

              functionResult = {
                ...newAppt,
                gcal_sync: createSync.success ? 'synced' : 'pending',
                gcal_event_id: createSync.google_event_id,
              };
              break;
            }

            case 'rescheduleAppointment': {
              const newStartTime = call.args.newTime as string;
              const newEndTime = (call.args.newEndTime as string) || computeEndTime(newStartTime, 60);

              // 1. Get current appointment (for GCal event ID)
              const currentAppt = await dbService.getDocument('appointments', call.args.appointmentId as string);
              const patient = await dbService.getDocument('patients', currentAppt.patient_id as string);
              appointmentId = currentAppt.id;

              // 2. Update in Supabase
              const updatedAppt = await dbService.updateAppointment(call.args.appointmentId as string, {
                appointment_date: call.args.newDate as string,
                start_time: newStartTime,
                end_time: newEndTime,
                status: 'rescheduled',
                updated_by_user: userId,
                sync_status: 'pending',
              });

              // 3. Sync to Google Calendar
              gcalSyncAttempted = true;
              let rescheduleSync;

              if (currentAppt.google_event_id) {
                rescheduleSync = await updateGoogleCalendarEvent(
                  currentAppt.google_event_id,
                  {
                    id: currentAppt.id,
                    appointment_date: call.args.newDate as string,
                    start_time: newStartTime,
                    end_time: newEndTime,
                    patient_id: currentAppt.patient_id,
                    professional_id: currentAppt.professional_id,
                    status: 'rescheduled',
                  },
                  currentAppt.google_calendar_id || CLINIC_CALENDAR_ID,
                  undefined,
                  patient.email
                );
              } else {
                // No existing GCal event — create new one
                rescheduleSync = await createGoogleCalendarEvent(
                  {
                    id: currentAppt.id,
                    appointment_date: call.args.newDate as string,
                    start_time: newStartTime,
                    end_time: newEndTime,
                    patient_id: currentAppt.patient_id,
                    professional_id: currentAppt.professional_id,
                    status: 'rescheduled',
                  },
                  CLINIC_CALENDAR_ID,
                  undefined,
                  patient.email
                );
              }

              gcalSyncSuccess = rescheduleSync.success;
              await dbService.updateSyncStatus(currentAppt.id, rescheduleSync);

              await dbService.recordHistory({
                appointment_id: currentAppt.id,
                changed_by: userId,
                change_type: 'rescheduled',
                previous_data: { appointment_date: currentAppt.appointment_date, start_time: currentAppt.start_time },
                new_data: { appointment_date: call.args.newDate, start_time: newStartTime },
                notes: `Reprogramada por agente IA. GCal sync: ${rescheduleSync.success ? '✅' : '❌ pendiente'}`,
              });

              functionResult = {
                ...updatedAppt,
                gcal_sync: rescheduleSync.success ? 'synced' : 'pending',
              };
              break;
            }

            case 'cancelAppointment': {
              // 1. Get current appointment
              const apptToCancel = await dbService.getDocument('appointments', call.args.appointmentId as string);
              appointmentId = apptToCancel.id;

              // 2. Cancel in Supabase
              const cancelledAppt = await dbService.cancelAppointment(call.args.appointmentId as string, userId);

              // 3. Cancel in Google Calendar (GoHighLevel detects this and stops workflows)
              gcalSyncAttempted = true;
              let cancelSync;

              if (apptToCancel.google_event_id) {
                cancelSync = await cancelGoogleCalendarEvent(
                  apptToCancel.google_event_id,
                  apptToCancel.google_calendar_id || CLINIC_CALENDAR_ID
                );
              } else {
                cancelSync = { success: true, sync_status: 'not_configured' as const };
              }

              gcalSyncSuccess = cancelSync.success;
              await dbService.updateSyncStatus(apptToCancel.id, cancelSync);

              await dbService.recordHistory({
                appointment_id: apptToCancel.id,
                changed_by: userId,
                change_type: 'cancelled',
                previous_data: { status: apptToCancel.status },
                new_data: { status: 'cancelled' },
                notes: `Cancelada por agente IA. Razón: ${call.args.reason || 'No especificada'}. GCal sync: ${cancelSync.success ? '✅' : '❌'}`,
              });

              functionResult = { ...cancelledAppt, gcal_sync: cancelSync.success ? 'synced' : 'pending' };
              break;
            }

            case 'confirmAppointment': {
              const apptToConfirm = await dbService.getDocument('appointments', call.args.appointmentId as string);
              const patient = await dbService.getDocument('patients', apptToConfirm.patient_id as string);
              appointmentId = apptToConfirm.id;

              const confirmedAppt = await dbService.confirmAppointment(call.args.appointmentId as string, userId);

              // Update in GCal (changes event color to green)
              gcalSyncAttempted = true;
              let confirmSync;

              if (apptToConfirm.google_event_id) {
                confirmSync = await updateGoogleCalendarEvent(
                  apptToConfirm.google_event_id,
                  {
                    id: apptToConfirm.id,
                    appointment_date: apptToConfirm.appointment_date,
                    start_time: apptToConfirm.start_time,
                    end_time: apptToConfirm.end_time,
                    patient_id: apptToConfirm.patient_id,
                    professional_id: apptToConfirm.professional_id,
                    status: 'confirmed',
                  },
                  apptToConfirm.google_calendar_id || CLINIC_CALENDAR_ID,
                  undefined,
                  patient.email
                );
              } else {
                confirmSync = { success: true, sync_status: 'not_configured' as const };
              }

              gcalSyncSuccess = confirmSync.success;
              await dbService.updateSyncStatus(apptToConfirm.id, confirmSync);

              await dbService.recordHistory({
                appointment_id: apptToConfirm.id,
                changed_by: userId,
                change_type: 'confirmed',
                new_data: { status: 'confirmed' },
                notes: `Confirmada por agente IA. GCal sync: ${confirmSync.success ? '✅' : '❌'}`,
              });

              functionResult = { ...confirmedAppt, gcal_sync: confirmSync.success ? 'synced' : 'pending' };
              break;
            }

            default:
              functionResult = { error: `Función desconocida: ${call.name}` };
          }
        } catch (actionError: any) {
          console.error(`[Agent] Error executing ${call.name}:`, actionError);
          functionResult = { error: actionError.message };
        }

        // Log every action in agent_logs (audit trail)
        await dbService.logAgentInteraction({
          user_id: userId,
          user_message: message,
          interpretation: call,
          action_executed: call.name,
          result: functionResult,
          appointment_id: appointmentId,
          google_sync_attempted: gcalSyncAttempted,
          google_sync_success: gcalSyncSuccess,
        });

        toolOutputs.push({
          callId: (call as any).id || call.name,
          output: functionResult,
        });
      }

      // Let Gemini compose the final response with the tool results
      const finalResponse = await chat.sendMessage({
        message: `Resultados de las herramientas ejecutadas: ${JSON.stringify(toolOutputs)}. 
Resume al usuario qué se hizo y confirma si la sincronización con Google Calendar fue exitosa o está pendiente.`,
      });

      return finalResponse.text || 'Acción completada.';

    } catch (error: any) {
      console.error('[Agent] Unhandled error:', error);
      return `Lo siento, ocurrió un error al procesar tu solicitud: ${error.message || 'Error desconocido'}. Por favor intenta de nuevo.`;
    }
  },
};
