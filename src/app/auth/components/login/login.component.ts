import {Component, effect, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {AlertComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {environment} from '../../../../environments/environment';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, AlertComponent],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {

    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(NavigationService);

    isLoading = signal(false);
    errorMessage = signal('');
    showRegister = environment.config.showRegister;

    loginForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    constructor() {
        effect(() => {
            const user = this.authService.user();

            if (user) {
                this.isLoading.set(false);
                this.router.navigate(['/dashboard']);
            }
        });
    }

    onSubmit(): void {
        if (this.loginForm.invalid) return;

        this.isLoading.set(true);
        this.errorMessage.set('');

        const {email, password} = this.loginForm.getRawValue();

        this.authService.login(email, password).subscribe({
            error: err => {
                this.isLoading.set(false);
                this.errorMessage.set(
                    err?.message ?? 'Error al iniciar sesión'
                );
            }
        });
    }

    dismissError(): void {
        this.errorMessage.set('');
    }
}