/**
 * Google Calendar Service
 *
 * Handles all synchronization between Agenda Clínica 440 and Google Calendar.
 *
 * ARCHITECTURE (official):
 *   Agenda 440 (source of truth) → Google Calendar → GoHighLevel (automations)
 *
 * Primary clinic calendar: drgio@440clinic.com
 * Each professional may have their own calendar ID (stored in professionals.google_calendar_id).
 *
 * Production setup requires:
 *   1. Google OAuth2 App in Google Cloud Console
 *   2. Scopes: calendar.events, calendar.readonly
 *   3. OAuth token obtained and stored per authenticated session
 */

const CLINIC_TIMEZONE = 'America/Bogota';
export const CLINIC_CALENDAR_ID = 'drgio@440clinic.com';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppointmentForSync {
  id: string;
  appointment_date: string;  // YYYY-MM-DD
  start_time: string;        // HH:MM
  end_time: string;          // HH:MM
  patient_name?: string;
  professional_name?: string;
  type_name?: string;
  observations?: string;
  patient_id: string;
  professional_id: string;
  status?: string;
}

export interface SyncResult {
  success: boolean;
  google_event_id?: string;
  google_calendar_id?: string;
  sync_status: 'synced' | 'pending' | 'failed' | 'not_configured';
  error?: string;
}

interface GoogleCalendarEvent {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  extendedProperties: {
    private: Record<string, string>;
  };
  colorId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDateTime(date: string, time: string): string {
  return `${date}T${time.length === 5 ? time + ':00' : time}`;
}

function buildEventPayload(appt: AppointmentForSync): GoogleCalendarEvent {
  const title = `${appt.type_name || 'Cita Médica'} — ${appt.patient_name || 'Paciente'}`;

  const descLines = [
    `👤 Paciente: ${appt.patient_name || 'N/A'}`,
    `🩺 Profesional: ${appt.professional_name || 'N/A'}`,
    `📋 Tipo: ${appt.type_name || 'N/A'}`,
    appt.observations ? `💬 Notas: ${appt.observations}` : null,
    '',
    '─────────────────────────────',
    '🏥 Agenda Clínica 440 · Dr. Gio',
    `🔑 ID: ${appt.id}`,
    `📌 Estado: ${appt.status || 'pending'}`,
  ].filter(Boolean).join('\n');

  // Color coding by status
  const colorMap: Record<string, string> = {
    confirmed: '2',   // Sage / green
    pending: '5',     // Banana / yellow
    cancelled: '11',  // Tomato / red
    rescheduled: '6', // Tangerine / orange
  };

  return {
    summary: title,
    description: descLines,
    start: {
      dateTime: buildDateTime(appt.appointment_date, appt.start_time),
      timeZone: CLINIC_TIMEZONE,
    },
    end: {
      dateTime: buildDateTime(appt.appointment_date, appt.end_time),
      timeZone: CLINIC_TIMEZONE,
    },
    colorId: colorMap[appt.status || 'pending'] || '5',
    extendedProperties: {
      private: {
        agenda440_id: appt.id,
        patient_id: appt.patient_id,
        professional_id: appt.professional_id,
        source: 'agenda-clínica-440',
      },
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Creates a new event in Google Calendar.
 * Falls back gracefully if OAuth token is not available (queues for later sync).
 */
export async function createGoogleCalendarEvent(
  appointment: AppointmentForSync,
  calendarId: string = CLINIC_CALENDAR_ID,
  oauthToken?: string,
  patientEmail?: string
): Promise<SyncResult> {
  const token = oauthToken || localStorage.getItem('GOOGLE_OAUTH_TOKEN');

  if (!token) {
    console.warn('[GCal] No OAuth token — event will sync when credentials are configured.');
    return {
      success: false,
      sync_status: 'pending',
      error: 'OAuth not configured. Event queued.',
    };
  }

  const payload = buildEventPayload(appointment);

  // Add patient as attendee if email is provided
  if (patientEmail) {
    (payload as any).attendees = [{ email: patientEmail }];
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log('[GCal] ✅ Event created & Email sent to:', patientEmail || 'N/A');

    return {
      success: true,
      sync_status: 'synced',
      google_event_id: data.id,
      google_calendar_id: calendarId,
    };
  } catch (e: any) {
    console.error('[GCal] ❌ Create error:', e.message);
    return { success: false, sync_status: 'failed', error: e.message };
  }
}

/**
 * Updates an existing Google Calendar event (rescheduling, confirmation, etc.).
 */
export async function updateGoogleCalendarEvent(
  googleEventId: string,
  appointment: AppointmentForSync,
  calendarId: string = CLINIC_CALENDAR_ID,
  oauthToken?: string,
  patientEmail?: string
): Promise<SyncResult> {
  const token = oauthToken || localStorage.getItem('GOOGLE_OAUTH_TOKEN');

  if (!token) {
    console.warn('[GCal] No OAuth token — update queued.');
    return { success: false, sync_status: 'pending', error: 'OAuth not configured.' };
  }

  const payload = buildEventPayload(appointment);
  if (patientEmail) {
    (payload as any).attendees = [{ email: patientEmail }];
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}?sendUpdates=all`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log('[GCal] ✅ Event updated:', data.id);

    return {
      success: true,
      sync_status: 'synced',
      google_event_id: data.id,
      google_calendar_id: calendarId,
    };
  } catch (e: any) {
    console.error('[GCal] ❌ Update error:', e.message);
    return { success: false, sync_status: 'failed', error: e.message };
  }
}

/**
 * Cancels a Google Calendar event (marks it as cancelled in GCal via DELETE).
 * GoHighLevel detects this change and stops any associated workflows.
 */
export async function cancelGoogleCalendarEvent(
  googleEventId: string,
  calendarId: string = CLINIC_CALENDAR_ID,
  oauthToken?: string
): Promise<SyncResult> {
  const token = oauthToken || localStorage.getItem('GOOGLE_OAUTH_TOKEN');

  if (!token) {
    console.warn('[GCal] No OAuth token — cancellation queued.');
    return { success: false, sync_status: 'pending', error: 'OAuth not configured.' };
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // 204 = success, 410 = already deleted (both are ok)
    if (!res.ok && res.status !== 410) {
      throw new Error(`HTTP ${res.status}`);
    }

    console.log('[GCal] ✅ Event cancelled:', googleEventId);
    return {
      success: true,
      sync_status: 'synced',
      google_event_id: googleEventId,
      google_calendar_id: calendarId,
    };
  } catch (e: any) {
    console.error('[GCal] ❌ Cancel error:', e.message);
    return { success: false, sync_status: 'failed', error: e.message };
  }
}

// ─── Backwards-compatible export (existing code used googleCalendarService.xxx) ───

/** @deprecated Use standalone functions instead */
export const googleCalendarService = {
  connect: () => console.log('[GCal] Connect: configure OAuth2 in Google Cloud Console → drgio@440clinic.com'),
  createEvent: (appt: AppointmentForSync) => createGoogleCalendarEvent(appt),
  updateEvent: (id: string, appt: AppointmentForSync) => updateGoogleCalendarEvent(id, appt),
  deleteEvent: (id: string) => cancelGoogleCalendarEvent(id),
};
