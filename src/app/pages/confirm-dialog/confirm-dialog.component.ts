import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirmar</h2>
    <mat-dialog-content>
      ¿Está seguro que quiere borrar este elemento?
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancelar</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true" cdkFocusInitial>Borrar</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  onNoClick(): void {
    this.dialogRef.close(false);
  }
}
