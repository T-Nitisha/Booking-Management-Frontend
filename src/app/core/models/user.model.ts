export interface CurrentUser {
  email: string;
  name: string;
  role: 'Patient' | 'Doctor' | 'Admin';
}
