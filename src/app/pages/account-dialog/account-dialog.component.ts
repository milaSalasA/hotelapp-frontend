import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoginService } from '../../services/login.service';

interface UserProfile {
  username: string;
  roles: string[];
}

@Component({
  selector: 'app-account-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './account-dialog.component.html',
  styleUrl: './account-dialog.component.css',
})
export class AccountDialogComponent implements OnInit {
  private readonly loginService = inject(LoginService);
  private readonly dialogRef = inject(MatDialogRef<AccountDialogComponent>);

  protected $profile = signal<UserProfile | null>(null);
  protected $loading = signal(true);

  ngOnInit() {
    this.loginService.showUserInfo().subscribe({
      next: (data) => {
        this.$profile.set({ username: data.username, roles: data.roles ?? [] });
        this.$loading.set(false);
      },
      error: () => this.$loading.set(false),
    });
  }

  close() {
    this.dialogRef.close();
  }
}
