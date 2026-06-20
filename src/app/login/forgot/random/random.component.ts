import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoginService } from '../../../services/login.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map, switchMap } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-random',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    RouterLink,
    MatToolbarModule
  ],
  templateUrl: './random.component.html',
  styleUrl: './random.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RandomComponent {
  private readonly fb = inject(FormBuilder);
  private readonly loginService = inject(LoginService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form: FormGroup;  
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  loading = signal(false);

  protected readonly $random = toSignal(
    this.route.params.pipe(map(params => params['random'] as string))
  );  

  protected readonly $form = signal(
    new FormBuilder().group(
      {
        password: new FormControl(''),
        confirmPassword: new FormControl(''),
      },
      { validators: this.passwordsMatchValidator }
    )
  );

  protected $validRandom = signal(false);

  constructor() {
    this.route.params.pipe(
      map(params => params['random'] as string),
      //filter(random => random !== null && random !== undefined && random !== "")
      filter(random => !!random), 
      switchMap(random => this.loginService.checkRandomReset(random)),
      takeUntilDestroyed()
    ).subscribe((data) => {
      if (data === 1) {
        this.$validRandom.set(true);
      } else {
        this.$validRandom.set(false);

        setTimeout(() => {
          this.router.navigate(['login']);
        }, 2000);
      }
    });
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility() {
    this.hidePassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility() {
    this.hideConfirmPassword.update((v) => !v);
  }

  onSubmit() {
    if (this.$form().invalid || this.loading()) return;

    this.loading.set(true);
    const password = this.$form().get('password')?.value;

    this.loginService.resetPassword(this.$random(), password).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open('Password successfully changed!', 'Close', { duration: 5000 });
        this.router.navigate(['/login']);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error resetting password. Please try again.', 'Close', { duration: 5000 });
      }
    });
  }
}
