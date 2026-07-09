import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { CurrencyPipe } from '@angular/common';
import { map, tap } from 'rxjs';
import { AdditionalService } from '../../../model/additional-service';
import { ReservationAdditionalService } from '../../../model/reservation-additional-service';
import { AdditionalServiceService } from '../../../services/additional-service.service';
import { ReservationAdditionalServiceService } from '../../../services/reservation-additional-service.service';

export interface ReservationServicesDialogData {
  reservationId: number;
  customerName: string;
}

@Component({
  selector: 'app-reservation-services-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatDividerModule,
    CurrencyPipe,
  ],
  templateUrl: './reservation-services-dialog.component.html',
  styleUrl: './reservation-services-dialog.component.css',
})
export class ReservationServicesDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ReservationServicesDialogComponent>);
  private readonly data = inject<ReservationServicesDialogData>(MAT_DIALOG_DATA);
  private readonly rasService = inject(ReservationAdditionalServiceService);
  private readonly catalogService = inject(AdditionalServiceService);

  protected readonly reservationId = this.data.reservationId;
  protected readonly customerName = this.data.customerName;
  protected readonly displayedColumns = ['name', 'category', 'qty', 'unitPrice', 'total', 'notes', 'actions'];

  protected $services = signal<ReservationAdditionalService[]>([]);
  protected $catalog = toSignal(
    this.catalogService.findAll().pipe(map(list => list.filter(s => s.availableDto))),
    { initialValue: [] as AdditionalService[] }
  );
  protected $isSaving = signal(false);

  protected $addForm = signal(new FormGroup({
    additionalService: new FormControl<AdditionalService | null>(null, [Validators.required]),
    quantityDto: new FormControl<number>(1, [Validators.required, Validators.min(1)]),
    notesDto: new FormControl<string>(''),
  }));

  protected $f = computed(() => this.$addForm().controls);

  protected $grandTotal = computed(() =>
    this.$services().reduce((acc, s) => acc + (s.totalPriceDto ?? 0), 0)
  );

  protected readonly categoryLabels: Record<string, string> = {
    FOOD: 'Comida',
    BEVERAGE: 'Bebida',
    PERSONAL_CARE: 'Cuidado Personal',
    OTHER: 'Otro',
  };

  constructor() {
    this.loadServices();
  }

  private loadServices() {
    this.rasService.findByReservation(this.reservationId).subscribe(data => this.$services.set(data));
  }

  add() {
    const form = this.$addForm();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const fv = form.value;
    const payload: ReservationAdditionalService = {
      reservationId: this.reservationId,
      additionalService: fv.additionalService!,
      quantityDto: fv.quantityDto!,
      notesDto: fv.notesDto || undefined,
    };

    this.$isSaving.set(true);
    this.rasService.save(payload).pipe(
      tap(() => this.loadServices()),
      tap(() => form.reset({ quantityDto: 1 }))
    ).subscribe({
      complete: () => this.$isSaving.set(false),
      error: () => this.$isSaving.set(false),
    });
  }

  remove(id: number) {
    this.rasService.delete(id).pipe(
      tap(() => this.loadServices())
    ).subscribe();
  }

  close() {
    this.dialogRef.close();
  }
}
