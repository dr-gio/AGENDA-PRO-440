export type UserRole = 'admin' | 'reception' | 'coordination' | 'doctor' | 'assistant';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Patient {
  id: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  city: string;
  observations?: string;
  createdAt: string;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  type: 'internal' | 'external';
  calendarId?: string;
  status: 'active' | 'inactive';
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  calendarId?: string;
  status: 'active' | 'inactive';
  availability?: string; // JSON string for complex availability
}

export interface AppointmentType {
  id: string;
  name: string;
  duration: number; // in minutes
  allowedProfessionals: string[]; // IDs
  isResourceRequired: boolean;
  bufferBefore: number; // in minutes
  bufferAfter: number; // in minutes
  requiresConfirmation: boolean;
  autoNotify: boolean;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'attended' | 'no-show';

export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  resourceId?: string;
  typeId: string;
  locationId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number;
  status: AppointmentStatus;
  observations?: string;
  creatorId: string;
  googleEventId?: string;
  googleCalendarId?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentAttendee {
  id: string;
  appointmentId: string;
  name: string;
  email: string;
  type: 'patient' | 'external_professional' | 'family' | 'nurse' | 'therapist' | 'referring_doctor';
}

export interface AuditLog {
  id: string;
  entityId: string;
  entityType: 'appointment' | 'patient' | 'professional' | 'resource';
  action: 'create' | 'update' | 'delete';
  changes: string; // JSON string of changes
  userId: string;
  timestamp: string;
  reason?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
}
