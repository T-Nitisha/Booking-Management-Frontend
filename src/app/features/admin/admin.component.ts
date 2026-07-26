import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Department } from '../../core/models/department.model';
import { Doctor } from '../../core/models/doctor.model';

/// <summary>
/// Admin-only screen for managing reference data: departments, doctors, and
/// bulk slot generation. Replaces the manual SQL seeding used during initial
/// development with real CRUD endpoints backed by [Authorize(Roles="Admin")].
/// </summary>
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h2>Admin</h2>

      @if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      }
      @if (statusMessage()) {
        <p class="status">{{ statusMessage() }}</p>
      }

      <section>
        <h3>Departments</h3>
        <ul class="list">
          @for (dept of departments(); track dept.id) {
            <li>
              <span>{{ dept.name }} — {{ dept.description }}</span>
              <button (click)="deleteDepartment(dept.id)">Delete</button>
            </li>
          }
        </ul>
        <div class="form-row">
          <input [(ngModel)]="newDeptName" placeholder="Department name" />
          <input [(ngModel)]="newDeptDescription" placeholder="Description" />
          <button (click)="createDepartment()">Add Department</button>
        </div>
      </section>

      <section>
        <h3>Doctors</h3>
        <ul class="list">
          @for (doc of doctors(); track doc.id) {
            <li>
              <span>Dr. {{ doc.fullName }} ({{ doc.specialization }}) — {{ doc.departmentName }}</span>
              <button (click)="deleteDoctor(doc.id)">Delete</button>
            </li>
          }
        </ul>
        <div class="form-row">
          <input [(ngModel)]="newDoctorName" placeholder="Full name" />
          <input [(ngModel)]="newDoctorSpecialization" placeholder="Specialization" />
          <input [(ngModel)]="newDoctorEmail" placeholder="Email" />
          <select [(ngModel)]="newDoctorDepartmentId">
            <option value="" disabled selected>Department</option>
            @for (dept of departments(); track dept.id) {
              <option [value]="dept.id">{{ dept.name }}</option>
            }
          </select>
          <button (click)="createDoctor()">Add Doctor</button>
        </div>
      </section>

      <section>
        <h3>Generate Slots</h3>
        <div class="form-row">
          <select [(ngModel)]="generateDoctorId">
            <option value="" disabled selected>Doctor</option>
            @for (doc of doctors(); track doc.id) {
              <option [value]="doc.id">Dr. {{ doc.fullName }}</option>
            }
          </select>
          <label>From <input type="date" [(ngModel)]="generateFromDate" /></label>
          <label>To <input type="date" [(ngModel)]="generateToDate" /></label>
          <label>Start hour (UTC) <input type="number" min="0" max="23" [(ngModel)]="generateStartHour" /></label>
          <label>End hour (UTC) <input type="number" min="1" max="24" [(ngModel)]="generateEndHour" /></label>
          <button (click)="generateSlots()">Generate</button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    section { margin-bottom: 2rem; }
    .list { list-style: none; padding: 0; }
    .list li { display: flex; justify-content: space-between; align-items: center; padding: .5rem .75rem; border: 1px solid #eee; border-radius: 8px; margin-bottom: .4rem; }
    .form-row { display: flex; flex-wrap: wrap; gap: .5rem; align-items: end; }
    .form-row input, .form-row select { padding: .4rem; }
    .error { color: #b00020; }
    .status { color: #1b5e20; }
  `]
})
export class AdminComponent implements OnInit {
  readonly departments = signal<Department[]>([]);
  readonly doctors = signal<Doctor[]>([]);
  readonly errorMessage = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);

  newDeptName = '';
  newDeptDescription = '';

  newDoctorName = '';
  newDoctorSpecialization = '';
  newDoctorEmail = '';
  newDoctorDepartmentId = '';

  generateDoctorId = '';
  generateFromDate = '';
  generateToDate = '';
  generateStartHour = 9;
  generateEndHour = 17;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.reloadDepartments();
    this.reloadDoctors();
  }

  createDepartment(): void {
    if (!this.newDeptName) {
      return;
    }
    this.clearMessages();
    this.api.createDepartment({ name: this.newDeptName, description: this.newDeptDescription }).subscribe({
      next: () => {
        this.newDeptName = '';
        this.newDeptDescription = '';
        this.statusMessage.set('Department created.');
        this.reloadDepartments();
      },
      error: () => this.errorMessage.set('Failed to create department.')
    });
  }

  deleteDepartment(id: string): void {
    this.clearMessages();
    this.api.deleteDepartment(id).subscribe({
      next: () => {
        this.statusMessage.set('Department deleted.');
        this.reloadDepartments();
      },
      error: () => this.errorMessage.set('Failed to delete department (it may still have doctors assigned).')
    });
  }

  createDoctor(): void {
    if (!this.newDoctorName || !this.newDoctorDepartmentId) {
      return;
    }
    this.clearMessages();
    this.api.createDoctor({
      fullName: this.newDoctorName,
      specialization: this.newDoctorSpecialization,
      email: this.newDoctorEmail,
      departmentId: this.newDoctorDepartmentId
    }).subscribe({
      next: () => {
        this.newDoctorName = '';
        this.newDoctorSpecialization = '';
        this.newDoctorEmail = '';
        this.newDoctorDepartmentId = '';
        this.statusMessage.set('Doctor created.');
        this.reloadDoctors();
      },
      error: () => this.errorMessage.set('Failed to create doctor.')
    });
  }

  deleteDoctor(id: string): void {
    this.clearMessages();
    this.api.deleteDoctor(id).subscribe({
      next: () => {
        this.statusMessage.set('Doctor deleted.');
        this.reloadDoctors();
      },
      error: () => this.errorMessage.set('Failed to delete doctor.')
    });
  }

  generateSlots(): void {
    if (!this.generateDoctorId || !this.generateFromDate || !this.generateToDate) {
      return;
    }
    this.clearMessages();
    this.api.generateSlots({
      doctorId: this.generateDoctorId,
      fromDate: this.generateFromDate,
      toDate: this.generateToDate,
      startHourUtc: Number(this.generateStartHour),
      endHourUtc: Number(this.generateEndHour)
    }).subscribe({
      next: res => this.statusMessage.set(`Created ${res.created} slots.`),
      error: () => this.errorMessage.set('Failed to generate slots.')
    });
  }

  private reloadDepartments(): void {
    this.api.getDepartments().subscribe({ next: depts => this.departments.set(depts) });
  }

  private reloadDoctors(): void {
    this.api.getDoctors().subscribe({ next: docs => this.doctors.set(docs) });
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.statusMessage.set(null);
  }
}
