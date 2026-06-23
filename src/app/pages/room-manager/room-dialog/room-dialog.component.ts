import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatToolbarModule } from '@angular/material/toolbar';
import { switchMap, tap } from 'rxjs';
import { Room } from '../../../model/room';
import { RoomService } from '../../../services/room.service';

@Component({
  selector: 'app-room-dialog',
  imports: [
    MatDialogModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    ReactiveFormsModule,
  ],
  templateUrl: './room-dialog.component.html',
  styleUrl: './room-dialog.component.css',
})
export class RoomDialogComponent {
  private readonly roomService = inject(RoomService);
  private readonly data = inject<Room>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RoomDialogComponent>);

  protected readonly roomTypes = ['Single', 'Double', 'Suite', 'Deluxe', 'Family'];

  protected $form = signal(new FormGroup({
    idRoom: new FormControl<number>(this.data?.idRoom ?? 0),
    numberDto: new FormControl<string>(this.data?.numberDto ?? '', [Validators.required, Validators.minLength(1)]),
    typeDto: new FormControl<string>(this.data?.typeDto ?? '', [Validators.required]),
    priceDto: new FormControl<number>(this.data?.priceDto ?? 0, [Validators.required, Validators.min(0)]),
    availableDto: new FormControl<boolean>(this.data?.availableDto ?? true),
  }));

  protected $isEdit = computed(() => (this.$form().value.idRoom ?? 0) > 0);
  protected $f = computed(() => this.$form().controls);

  operate() {
    if (this.$form().invalid) return;

    const room = this.$form().value as Room;
    const isEdit = this.$isEdit();
    const msg = isEdit ? 'UPDATED' : 'CREATED';
    const operation$ = isEdit
      ? this.roomService.update(room.idRoom, room)
      : this.roomService.save(room);

    operation$.pipe(
      switchMap(() => this.roomService.findAll()),
      tap(data => this.roomService.setListChange(data)),
      tap(() => this.roomService.setMessageChange(msg))
    ).subscribe(() => this.close());
  }

  close() {
    this.dialogRef.close();
  }
}
