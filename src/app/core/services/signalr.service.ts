import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface SlotEvent {
  id: string;
  slotId: string;
  patientId: string;
  status: string;
  doctorId: string;
  startTimeUtc: string;
}

/// <summary>
/// Connects to the SchedulingHub and joins a per-doctor group. The Api's
/// BookingEventsRelayService forwards Redis Pub/Sub messages here, so any tab
/// viewing a doctor's calendar sees slots flip between Available/Booked live,
/// with no polling required.
/// </summary>
@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection?: signalR.HubConnection;
  private currentDoctorId?: string;

  readonly slotBooked$ = new Subject<SlotEvent>();
  readonly slotReleased$ = new Subject<SlotEvent>();

  constructor(private readonly authService: AuthService) {}

  async connectToDoctorSchedule(doctorId: string): Promise<void> {
    if (this.hubConnection && this.currentDoctorId === doctorId) {
      return;
    }

    await this.disconnect();
    this.currentDoctorId = doctorId;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRHubUrl, {
        accessTokenFactory: () => this.authService.getIdToken() ?? ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('SlotBooked', (payload: string) => this.slotBooked$.next(JSON.parse(payload)));
    this.hubConnection.on('SlotReleased', (payload: string) => this.slotReleased$.next(JSON.parse(payload)));

    await this.hubConnection.start();
    await this.hubConnection.invoke('JoinDoctorSchedule', doctorId);
  }

  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = undefined;
      this.currentDoctorId = undefined;
    }
  }
}
