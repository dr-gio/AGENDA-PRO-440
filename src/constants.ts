export const APPOINTMENT_STATUSES = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmada', color: 'bg-emerald-100 text-emerald-700' },
  rescheduled: { label: 'Reprogramada', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Cancelada', color: 'bg-rose-100 text-rose-700' },
  attended: { label: 'Asistió', color: 'bg-indigo-100 text-indigo-700' },
  'no-show': { label: 'No Asistió', color: 'bg-slate-100 text-slate-700' },
};

export const ROLES = {
  admin: 'Administrador',
  reception: 'Recepción',
  coordination: 'Coordinación',
  doctor: 'Médico',
  assistant: 'Asistente',
};

export const ATTENDEE_TYPES = {
  patient: 'Paciente',
  external_professional: 'Profesional Externo',
  family: 'Familiar',
  nurse: 'Enfermera',
  therapist: 'Terapeuta',
  referring_doctor: 'Médico Remitente',
};
