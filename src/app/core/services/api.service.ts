import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, BookAppointmentRequest } from '../models/appointment.model';
import { Slot } from '../models/slot.model';
import { CreateDepartmentRequest, Department } from '../models/department.model';
import { CreateDoctorRequest, Doctor, GenerateSlotsRequest } from '../models/doctor.model';
import { CurrentUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getMe(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.baseUrl}/api/me`);
  }

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

  // --- Admin: departments ---

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.baseUrl}/api/departments`);
  }

  createDepartment(request: CreateDepartmentRequest): Observable<Department> {
    return this.http.post<Department>(`${this.baseUrl}/api/departments`, request);
  }

  deleteDepartment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/departments/${id}`);
  }

  // --- Admin: doctors ---

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.baseUrl}/api/doctors`);
  }

  createDoctor(request: CreateDoctorRequest): Observable<Doctor> {
    return this.http.post<Doctor>(`${this.baseUrl}/api/doctors`, request);
  }

  deleteDoctor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/doctors/${id}`);
  }

  // --- Admin: slots ---

  generateSlots(request: GenerateSlotsRequest): Observable<{ created: number }> {
    return this.http.post<{ created: number }>(`${this.baseUrl}/api/slots/generate`, request);
  }

  deleteSlot(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/slots/${id}`);
  }
}
