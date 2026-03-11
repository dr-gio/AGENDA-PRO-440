/**
 * Database Service — Agenda Clínica 440
 *
 * All writes to the appointments table MUST include:
 *   - created_by_user / updated_by_user (authenticated user UUID)
 *   - source_of_booking (who/what triggered the write)
 *   - google_event_id, google_calendar_id, sync_status (after GCal sync)
 */

import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateAppointmentPayload {
  patient_id: string;
  professional_id: string;
  resource_id?: string;
  type_id?: string;
  appointment_date: string;         // YYYY-MM-DD
  start_time: string;               // HH:MM
  end_time: string;                 // HH:MM
  observations?: string;
  status?: string;
  // Audit fields (MANDATORY)
  created_by_user: string;          // authenticated user UUID
  source_of_booking: 'internal_agent' | 'manual' | 'receptionist' | 'system';
  // Google Calendar (filled after sync)
  google_event_id?: string;
  google_calendar_id?: string;
  sync_status?: 'pending' | 'synced' | 'failed' | 'not_configured';
}

export interface UpdateAppointmentPayload {
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  observations?: string;
  resource_id?: string;
  // Audit fields (MANDATORY)
  updated_by_user: string;          // authenticated user UUID
  // Google Calendar (updated after sync)
  google_event_id?: string;
  google_calendar_id?: string;
  sync_status?: 'pending' | 'synced' | 'failed' | 'not_configured';
  last_synced_at?: string;
  sync_error?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const dbService = {

  // ── Appointments ────────────────────────────────────────────────────────────

  async createAppointment(payload: CreateAppointmentPayload) {
    const { data, error } = await supabase
      .from('appointments')
      .insert([{ ...payload, sync_status: payload.sync_status || 'pending' }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAppointment(id: string, payload: UpdateAppointmentPayload) {
    const { data, error } = await supabase
      .from('appointments')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async cancelAppointment(id: string, cancelledByUser: string) {
    return this.updateAppointment(id, {
      status: 'cancelled',
      updated_by_user: cancelledByUser,
      sync_status: 'pending', // Will be synced to GCal
    });
  },

  async confirmAppointment(id: string, confirmedByUser: string) {
    return this.updateAppointment(id, {
      status: 'confirmed',
      updated_by_user: confirmedByUser,
      sync_status: 'pending',
    });
  },

  /** Updates the Google Calendar sync fields after a successful or failed sync */
  async updateSyncStatus(
    id: string,
    syncResult: {
      sync_status: 'synced' | 'failed' | 'pending' | 'not_configured';
      google_event_id?: string;
      google_calendar_id?: string;
      sync_error?: string;
    }
  ) {
    const { error } = await supabase
      .from('appointments')
      .update({
        sync_status: syncResult.sync_status,
        google_event_id: syncResult.google_event_id,
        google_calendar_id: syncResult.google_calendar_id,
        last_synced_at: syncResult.sync_status === 'synced' ? new Date().toISOString() : undefined,
        sync_error: syncResult.sync_error || null,
      })
      .eq('id', id);

    if (error) console.error('[DB] Failed to update sync status:', error);
  },

  // ── Appointment History (Audit Trail) ───────────────────────────────────────

  async recordHistory(entry: {
    appointment_id: string;
    changed_by: string;
    change_type: 'created' | 'confirmed' | 'rescheduled' | 'cancelled' | 'attended' | 'no_show' | 'synced' | 'sync_failed';
    previous_data?: any;
    new_data?: any;
    notes?: string;
  }) {
    const { error } = await supabase
      .from('appointment_history')
      .insert([entry]);

    if (error) console.error('[DB] Failed to record history:', error);
  },

  // ── Google Sync Queue ────────────────────────────────────────────────────────

  async addToSyncQueue(appointmentId: string, operation: 'create' | 'update' | 'delete') {
    const { error } = await supabase
      .from('google_sync_queue')
      .insert([{ appointment_id: appointmentId, operation, status: 'pending' }]);

    if (error) console.error('[DB] Failed to add to sync queue:', error);
  },

  async markSyncQueueProcessed(queueId: string, success: boolean, errorMessage?: string) {
    const { error } = await supabase
      .from('google_sync_queue')
      .update({
        status: success ? 'success' : 'failed',
        last_attempt_at: new Date().toISOString(),
        error_message: errorMessage || null,
      })
      .eq('id', queueId);

    if (error) console.error('[DB] Failed to update sync queue:', error);
  },

  // ── Generic helpers (for components not yet migrated) ───────────────────────

  async getDocument(table: string, id: string) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getCollection(table: string, filters: Record<string, any> = {}) {
    let query = supabase.from(table).select('*');

    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null) {
        query = query.eq(key, filters[key]);
      }
    });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async addDocument(table: string, data: any) {
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async updateDocument(table: string, id: string, data: any) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  // ── Patient & Professional Searches ─────────────────────────────────────────

  async searchPatient(name: string) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .ilike('full_name', `%${name}%`);

    if (error) throw error;
    return data || [];
  },

  async searchProfessional(name: string) {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .ilike('name', `%${name}%`);

    if (error) throw error;
    return data || [];
  },

  async searchResource(name: string) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .ilike('name', `%${name}%`);

    if (error) throw error;
    return data || [];
  },

  async searchPatientByPhone(phone: string) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // ── Availability Check ───────────────────────────────────────────────────────

  async checkAvailability(professionalId: string, date: string, time: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('id')
      .eq('professional_id', professionalId)
      .eq('appointment_date', date)
      .eq('start_time', time)
      .neq('status', 'cancelled');

    if (error) throw error;
    return (data || []).length === 0; // true = available
  },

  // ── Agent Audit Logging ──────────────────────────────────────────────────────

  async logAgentInteraction(log: {
    user_id: string;
    user_message: string;
    interpretation: any;
    action_executed: string;
    result: any;
    appointment_id?: string;
    google_sync_attempted?: boolean;
    google_sync_success?: boolean;
  }) {
    const { error } = await supabase
      .from('agent_logs')
      .insert([log]);

    if (error) console.error('[DB] Failed to log agent interaction:', error);
  },

  // ── FAQs ─────────────────────────────────────────────────────────────────────

  async getFAQs() {
    const { data, error } = await supabase
      .from('faq_knowledge')
      .select('*')
      .eq('active', true);

    if (error) throw error;
    return data || [];
  },

  // ── Real-time subscriptions ──────────────────────────────────────────────────

  subscribeToTable(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  },
};
