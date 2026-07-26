import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login-card">
      <h1>Hospital Booking Management</h1>
      <p>Sign in with Google to search doctor slots and book appointments.</p>
      <div #googleButton></div>
    </div>
  `,
  styles: [`
    .login-card {
      max-width: 420px;
      margin: 15vh auto;
      padding: 2rem;
      text-align: center;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
  `]
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleButton') googleButton!: ElementRef<HTMLDivElement>;

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  ngAfterViewInit(): void {
    void this.authService.initializeGoogleSignIn(() => this.router.navigate(['/patient']));
    void this.authService.renderSignInButton(this.googleButton.nativeElement);
  }
}
