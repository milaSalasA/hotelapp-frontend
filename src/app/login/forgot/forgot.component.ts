import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink, RouterOutlet, ActivatedRoute } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { LoginService } from '../../services/login.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-forgot',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    RouterLink,
    RouterOutlet,
    NgOptimizedImage
  ],
  templateUrl: './forgot.component.html',
  styleUrl: './forgot.component.css',
})
export class ForgotComponent {
  private readonly loginService = inject(LoginService);
  private readonly snackBar = inject(MatSnackBar);
  public readonly route = inject(ActivatedRoute);

  // Form signals
  $email = signal('');
  
  // UI signals
  loading = signal(false);
  message = signal('');

  // Check if child route is active
  isChildActive = computed(() => {
    // This is a simple way to check if there's a child route active
    // If the first child of the current route exists, it's active
    return this.route.firstChild !== null;
  });

  // Derived signal for basic email validation
  isFormValid = computed(() => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(this.$email());
  });

  sendMail() {
    if (!this.isFormValid()) return;

    this.loading.set(true);
    this.message.set('');

    this.loginService.sendMail(this.$email()).subscribe(data => {
      if(data === 1){
        this.loading.set(false);
        this.message.set('Email Sent!');
        this.snackBar.open('Email Sent!', 'Close', { duration: 5000 });
      } else {
        this.loading.set(false);
        this.message.set('Error sending email. Please try again.');
        this.snackBar.open('Error sending email. Please try again.', 'Close', { duration: 5000 });
      }       
    }
    );
  }
}
