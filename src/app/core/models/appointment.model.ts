export interface Appointment {
  id: string;
  slotId: string;
  patientId: string;
  startTimeUtc: string;
  endTimeUtc: string;
  status: string;
  reason?: string;
}

export interface BookAppointmentRequest {
  slotId: string;
  reason?: string;
}
