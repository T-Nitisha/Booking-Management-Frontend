import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SignalRService } from '../../core/services/signalr.service';
import { Slot } from '../../core/models/slot.model';

/// <summary>
/// Lets a patient search a doctor's available slots and book one. Joins the
/// SignalR doctor group so that if another patient books a slot this patient
/// is currently viewing, it flips to "Booked" live — the concurrency showcase
/// feature discussed in the architecture: Redis lock + Postgres optimistic
/// concurrency on the backend, SignalR broadcast reflecting the outcome here.
/// </summary>
@Component({
  selector: 'app-patient-booking',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="page">
      <h2>Book an Appointment</h2>

      <div class="search-bar">
        <label>
          Doctor ID
          <input [(ngModel)]="doctorId" placeholder="paste a doctor GUID" />
        </label>
        <button (click)="search()">Search Available Slots</button>
      </div>

      @if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      }

      <ul class="slot-list">
        @for (slot of slots(); track slot.id) {
          <li [class.booked]="slot.status !== 'Available'">
            <span>{{ slot.startTimeUtc | date: 'medium' }} — Dr. {{ slot.doctorName }}</span>
            <span class="status">{{ slot.status }}</span>
            <button [disabled]="slot.status !== 'Available'" (click)="book(slot)">Book</button>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [`
    .page { max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
    .search-bar { display: flex; gap: 1rem; align-items: end; margin-bottom: 1.5rem; }
    .slot-list { list-style: none; padding: 0; }
    .slot-list li { display: flex; justify-content: space-between; align-items: center; padding: .75rem; border: 1px solid #eee; border-radius: 8px; margin-bottom: .5rem; }
    .slot-list li.booked { opacity: .5; }
    .status { font-weight: 600; }
    .error { color: #b00020; }
  `]
})
export class PatientBookingComponent implements OnInit, OnDestroy {
  doctorId = '';
  readonly slots = signal<Slot[]>([]);
  readonly errorMessage = signal<string | null>(null);

  private bookedSub?: Subscription;
  private releasedSub?: Subscription;

  constructor(private readonly api: ApiService, private readonly signalR: SignalRService) {}

  ngOnInit(): void {
    this.bookedSub = this.signalR.slotBooked$.subscribe(event => this.applyStatus(event.slotId, 'Booked'));
    this.releasedSub = this.signalR.slotReleased$.subscribe(event => this.applyStatus(event.slotId, 'Available'));
  }

  ngOnDestroy(): void {
    this.bookedSub?.unsubscribe();
    this.releasedSub?.unsubscribe();
    void this.signalR.disconnect();
  }

  search(): void {
    if (!this.doctorId) {
      return;
    }

    this.errorMessage.set(null);
    const fromUtc = new Date().toISOString();
    const toUtc = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    this.api.searchSlots(this.doctorId, fromUtc, toUtc).subscribe({
      next: slots => this.slots.set(slots),
      error: () => this.errorMessage.set('Could not load slots. Check the doctor ID and try again.')
    });

    void this.signalR.connectToDoctorSchedule(this.doctorId);
  }

  book(slot: Slot): void {
    this.errorMessage.set(null);

    this.api.bookAppointment({ slotId: slot.id }).subscribe({
      next: () => this.applyStatus(slot.id, 'Booked'),
      error: err => this.errorMessage.set(err?.error?.error ?? 'Booking failed. The slot may have just been taken.')
    });
  }

  private applyStatus(slotId: string, status: string): void {
    this.slots.update(current => current.map(s => (s.id === slotId ? { ...s, status } : s)));
  }
}
