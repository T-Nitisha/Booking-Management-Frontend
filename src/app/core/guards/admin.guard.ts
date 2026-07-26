import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();
  if (user?.role === 'Admin') {
    return true;
  }

  router.navigate(user ? ['/patient'] : ['/login']);
  return false;
};
