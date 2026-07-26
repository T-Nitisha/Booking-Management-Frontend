export interface Department {
  id: string;
  name: string;
  description: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description: string;
}
