import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CurrencyPipe, SlicePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, finalize, switchMap, tap } from 'rxjs';
import { Room } from '../../model/room';
import { Reservation } from '../../model/reservation';
import { ReservationAdditionalService } from '../../model/reservation-additional-service';
import { RoomService } from '../../services/room.service';
import { ReservationService } from '../../services/reservation.service';
import { ReservationAdditionalServiceService } from '../../services/reservation-additional-service.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ReservationServicesDialogComponent } from './reservation-services-dialog/reservation-services-dialog.component';

function checkOutAfterCheckIn(control: AbstractControl): ValidationErrors | null {
  const checkIn = control.get('checkInDate')?.value;
  const checkOut = control.get('checkOutDate')?.value;
  if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
    return { checkOutBeforeCheckIn: true };
  }
  return null;
}

@Component({
  selector: 'app-reservation-manager',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    CurrencyPipe,
    SlicePipe,
  ],
  templateUrl: './reservation-manager.component.html',
  styleUrl: './reservation-manager.component.css',
})
export class ReservationManagerComponent {
  private readonly roomService = inject(RoomService);
  private readonly reservationService = inject(ReservationService);
  private readonly rasService = inject(ReservationAdditionalServiceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected $rooms = toSignal(this.roomService.findAll(), { initialValue: [] });
  protected $availableRooms = computed(() => this.$rooms().filter(r => r.availableDto));

  protected $form = signal(new FormGroup({
    customerName: new FormControl<string>('', [Validators.required, Validators.minLength(3)]),
    room: new FormControl<Room | null>(null, [Validators.required]),
    checkInDate: new FormControl<string>('', [Validators.required]),
    checkOutDate: new FormControl<string>('', [Validators.required]),
  }, { validators: checkOutAfterCheckIn }));

  protected $f = computed(() => this.$form().controls);
  protected $conflictError = signal<string>('');
  protected $isSaving = signal(false);

  protected $dataSource = signal(new MatTableDataSource<Reservation>());
  protected displayedColumns = ['expand', 'idReservation', 'customerName', 'checkInDate', 'checkOutDate', 'roomNumber', 'actions', 'services'];
  protected detailColumns = ['expandedDetail'];
  protected $reservations = this.reservationService.$listChange;
  protected $paginator = viewChild(MatPaginator);
  protected $sort = viewChild(MatSort);

  // ── Expandable row state ──────────────────────────────────────────────────
  protected $expandedId = signal<number | null>(null);
  protected $loadingId = signal<number | null>(null);
  protected $servicesCache = signal(new Map<number, ReservationAdditionalService[]>());

  protected readonly isExpandedRow = (_: number, row: Reservation) =>
    this.$expandedId() === row.idReservation;

  constructor() {
    this.reservationService.findAll().subscribe(data => this.reservationService.setListChange(data));
    this.initializeEffects();
  }

  private initializeEffects() {
    effect(() => {
      const data = this.$reservations();
      const ds = this.$dataSource();
      ds.data = data;
      ds.paginator = this.$paginator();
      ds.sort = this.$sort();
    });

    effect(() => {
      const message = this.reservationService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'INFO', { duration: 2000, horizontalPosition: 'right', verticalPosition: 'top' });
        untracked(() => this.reservationService.setMessageChange(''));
      }
    });

    effect(() => {
      this.$f().room.value;
      this.$f().checkInDate.value;
      this.$f().checkOutDate.value;
      untracked(() => this.$conflictError.set(''));
    });
  }

  // ── Expand / collapse ──────────────────────────────────────────
  toggleRow(reservation: Reservation) {
    const id = reservation.idReservation!;

    if (this.$expandedId() === id) {
      this.$expandedId.set(null);
      return;
    }

    this.$expandedId.set(id);

    if (!this.$servicesCache().has(id)) {
      this.$loadingId.set(id);
      this.rasService.findByReservation(id).subscribe({
        next: data => {
          this.$servicesCache.update(cache => new Map(cache).set(id, data));
          this.$loadingId.set(null);
        },
        error: () => this.$loadingId.set(null),
      });
    }
  }

  servicesOf(id: number): ReservationAdditionalService[] {
    return this.$servicesCache().get(id) ?? [];
  }

  totalOf(id: number): number {
    return this.servicesOf(id).reduce((acc, s) => acc + (s.totalPriceDto ?? 0), 0);
  }

  // ── Dialog — invalidates cache on close ──────────────────────────────────
  openServices(reservation: Reservation) {
    this.dialog.open(ReservationServicesDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { reservationId: reservation.idReservation, customerName: reservation.customerName },
    }).afterClosed().subscribe(() => {
      const id = reservation.idReservation!;
      if (this.$servicesCache().has(id)) {
        this.rasService.findByReservation(id).subscribe(data => {
          this.$servicesCache.update(cache => new Map(cache).set(id, data));
        });
      }
    });
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  save() {
    const form = this.$form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const fv = form.value;
    const checkIn = this.toLocalDateTimeString(fv.checkInDate!);
    const checkOut = this.toLocalDateTimeString(fv.checkOutDate!);
    const room = fv.room!;

    this.$isSaving.set(true);
    this.$conflictError.set('');

    this.reservationService.checkConflicts(room.idRoom, checkIn, checkOut).subscribe({
      next: (conflicts) => {
        if (conflicts.length > 0) {
          this.$conflictError.set(
            `La habitación ${room.numberDto} ya tiene ${conflicts.length} reserva(s) para esas fechas. Por favor seleccione otras fechas o habitación.`
          );
          this.$isSaving.set(false);
          return;
        }

        const reservation: Reservation = {
          customerName: fv.customerName!,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          room,
        };

        this.reservationService.save(reservation).pipe(
          switchMap(() => this.reservationService.findAll()),
          tap(data => this.reservationService.setListChange(data)),
          tap(() => this.reservationService.setMessageChange('CREATED')),
          finalize(() => this.$isSaving.set(false))
        ).subscribe({
          next: () => this.resetForm(),
          error: (err) => this.$conflictError.set(err?.error?.message ?? 'Error al guardar la reserva.'),
        });
      },
      error: () => {
        this.$isSaving.set(false);
        this.$conflictError.set('No se pudo verificar conflictos. Intente nuevamente.');
      },
    });
  }

  delete(idReservation: number) {
    this.dialog.open(ConfirmDialogComponent).afterClosed().pipe(
      filter(result => result),
      switchMap(() => this.reservationService.delete(idReservation)),
      switchMap(() => this.reservationService.findAll()),
      tap(data => this.reservationService.setListChange(data)),
      tap(() => this.reservationService.setMessageChange('DELETED'))
    ).subscribe();
  }

  applyFilter(e: Event) {
    const filterValue = (e.target as HTMLInputElement).value;
    this.$dataSource().filter = filterValue.trim().toLowerCase();
  }

  resetForm() {
    this.$form().reset();
    this.$conflictError.set('');
  }

  showDatePicker(event: MouseEvent) {
    (event.target as HTMLInputElement).showPicker?.();
  }

  private toLocalDateTimeString(datetimeLocal: string): string {
    return datetimeLocal.length === 16 ? `${datetimeLocal}:00` : datetimeLocal;
  }
}
