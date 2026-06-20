import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { LoginService } from '../services/login.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {

  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);

  loginForm: FormGroup = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(3)])
  });

  isFormValid = toSignal(
    this.loginForm.statusChanges.pipe(
      map(status => status === 'VALID')
    ),
    { initialValue: this.loginForm.valid }
  );

  isLoggingIn = signal(false);

  login() {
    if (this.loginForm.valid) {
      this.isLoggingIn.set(true);
      console.log('Logging in with:', this.loginForm.value);
      
      this.loginService.login(this.loginForm.value.username, this.loginForm.value.password).subscribe(data => {

        this.router.navigate(['/pages/dashboard']);
      });


      setTimeout(() => {
        this.isLoggingIn.set(false);
      }, 2000);
    }
  }

}
