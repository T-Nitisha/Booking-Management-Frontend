import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor(readonly authService: AuthService, private readonly router: Router) {}

  signOut(): void {
    this.authService.signOut();
    this.router.navigate(['/login']);
  }
}
