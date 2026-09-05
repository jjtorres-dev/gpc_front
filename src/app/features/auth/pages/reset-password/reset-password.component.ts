import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ...MATERIAL_IMPORTS],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly token = signal(this.route.snapshot.queryParamMap.get('token') ?? '');
  private readonly email = signal(this.route.snapshot.queryParamMap.get('email') ?? '');
  readonly hasToken = computed(() => this.token().length > 0);
  readonly hasEmail = computed(() => this.email().length > 0);
  /** El enlace del correo debe traer token y email; si falta alguno no se puede resetear. */
  readonly linkValid = computed(() => this.hasToken() && this.hasEmail());

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly success = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  submit(): void {
    if (this.form.invalid || !this.linkValid()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);

    this.authService.resetPassword(this.token(), this.email(), this.form.getRawValue().password).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.status === 400
            ? 'El enlace de recuperación expiró o no es válido. Solicita uno nuevo.'
            : 'No se pudo restablecer la contraseña. Intenta nuevamente.',
        );
      },
    });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
