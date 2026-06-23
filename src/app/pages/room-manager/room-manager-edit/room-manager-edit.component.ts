import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { Room } from '../../../model/room';
import { RoomService } from '../../../services/room.service';

@Component({
  selector: 'app-room-manager-edit',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    RouterLink,
  ],
  templateUrl: './room-manager-edit.component.html',
  styleUrl: './room-manager-edit.component.css',
})
export class RoomManagerEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roomService = inject(RoomService);

  protected readonly roomTypes = ['Single', 'Double', 'Suite', 'Deluxe', 'Family'];

  protected $form = signal(new FormGroup({
    idRoom: new FormControl<number | null>(null),
    numberDto: new FormControl<string>('', [Validators.required, Validators.minLength(1)]),
    typeDto: new FormControl<string>('', [Validators.required]),
    priceDto: new FormControl<number>(0, [Validators.required, Validators.min(0)]),
    availableDto: new FormControl<boolean>(true),
  }));

  private readonly $params = toSignal(this.route.params, { initialValue: {} });
  protected $id = computed(() => this.$params()['id']);
  protected $isEdit = computed(() => !!this.$id());
  protected $f = computed(() => this.$form().controls);

  constructor() {
    effect(() => {
      const id = this.$id();
      if (id) {
        this.roomService.findById(+id).subscribe(data => this.$form().patchValue(data));
      }
    });
  }

  operate() {
    const form = this.$form();
    if (form.invalid) return;

    const room = form.value as Room;
    const isEdit = this.$isEdit();
    const operation$ = isEdit
      ? this.roomService.update(+this.$id(), room)
      : this.roomService.save(room);

    operation$.pipe(
      switchMap(() => this.roomService.findAll()),
      tap(data => this.roomService.setListChange(data)),
      tap(() => this.roomService.setMessageChange(isEdit ? 'UPDATED' : 'CREATED'))
    ).subscribe(() => {
      this.router.navigate(['/pages/room-manager']);
    });
  }
}
