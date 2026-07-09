import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

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
    // Si el usuario llegó aquí está autenticado (pero sin permiso para la ruta),
    // así que se lo devuelve al dashboard.
    this.router.navigate(['/pages/dashboard']);
  }
}
