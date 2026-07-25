import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, BookAppointmentRequest } from '../models/appointment.model';
import { Slot } from '../models/slot.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  searchSlots(doctorId: string, fromUtc: string, toUtc: string): Observable<Slot[]> {
    return this.http.get<Slot[]>(`${this.baseUrl}/api/slots`, {
      params: { doctorId, fromUtc, toUtc }
    });
  }

  bookAppointment(request: BookAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/api/appointments`, request);
  }

  cancelAppointment(appointmentId: string, cancellationReason: string): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/api/appointments/${appointmentId}/cancel`, {
      cancellationReason
    });
  }
}
