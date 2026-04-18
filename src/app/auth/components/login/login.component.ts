import {Component, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AlertComponent, LoadingSpinnerComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  // signals en lugar de boolean/string
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: NavigationService
  ) {
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const {email, password} = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Error al iniciar sesión. Intente nuevamente.');
      }
    });
  }

  dismissError(): void {
    this.errorMessage.set('');
  }
}
