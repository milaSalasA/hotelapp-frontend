import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-not-403',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './not-403.component.html',
  styleUrl: './not-403.component.css',
})
export class Not403Component {
  private readonly router = inject(Router);

  goBack() {
    const token = sessionStorage.getItem(environment.TOKEN_NAME);
    if (token) {
      this.router.navigate(['/pages/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
