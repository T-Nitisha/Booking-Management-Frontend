export interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  email: string;
  departmentId: string;
  departmentName: string;
  authUserId: string | null;
}

export interface CreateDoctorRequest {
  fullName: string;
  specialization: string;
  email: string;
  departmentId: string;
}

export interface GenerateSlotsRequest {
  doctorId: string;
  fromDate: string;
  toDate: string;
  startHourUtc: number;
  endHourUtc: number;
}
