import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { filter, finalize, switchMap, tap } from 'rxjs';
import { AdditionalService, ServiceCategory } from '../../model/additional-service';
import { AdditionalServiceService } from '../../services/additional-service.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-service-manager',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    CurrencyPipe,
    RouterLink,
    RouterOutlet,
  ],
  templateUrl: './service-manager.component.html',
  styleUrl: './service-manager.component.css',
})
export class ServiceManagerComponent {
  private readonly serviceService = inject(AdditionalServiceService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected $dataSource = signal(new MatTableDataSource<AdditionalService>());
  protected displayedColumns: string[] = ['idService', 'nameDto', 'categoryDto', 'priceDto', 'availableDto', 'actions'];
  protected $services = this.serviceService.$listChange;

  protected $paginator = viewChild(MatPaginator);
  protected $sort = viewChild(MatSort);

  protected readonly categoryLabels: Record<string, string> = {
    FOOD: 'Comida',
    BEVERAGE: 'Bebida',
    PERSONAL_CARE: 'Cuidado Personal',
    OTHER: 'Otro',
  };

  protected readonly categories: { value: ServiceCategory; label: string }[] = [
    { value: 'FOOD',          label: 'Comida' },
    { value: 'BEVERAGE',      label: 'Bebida' },
    { value: 'PERSONAL_CARE', label: 'Cuidado Personal' },
    { value: 'OTHER',         label: 'Otro' },
  ];

  // ── Inline new-service form ──────────────────────────────────────────────
  protected $showForm = signal(false);
  protected $isSaving = signal(false);
  protected $newSvcForm = signal(this.buildForm());
  protected $nf = computed(() => this.$newSvcForm().controls);

  protected buildForm() {
    return new FormGroup({
      nameDto:        new FormControl<string>('', [Validators.required, Validators.minLength(2)]),
      descriptionDto: new FormControl<string>(''),
      priceDto:       new FormControl<number>(0, [Validators.required, Validators.min(0)]),
      categoryDto:    new FormControl<ServiceCategory | null>(null, [Validators.required]),
      availableDto:   new FormControl<boolean>(true),
    });
  }

  constructor() {
    this.serviceService.findAll().subscribe(data => this.serviceService.setListChange(data));
    this.initializeEffects();
  }

  private initializeEffects() {
    effect(() => {
      const data = this.$services();
      const ds = this.$dataSource();
      ds.data = data;
      ds.paginator = this.$paginator();
      ds.sort = this.$sort();
    });

    effect(() => {
      const message = this.serviceService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'INFO', { duration: 2000, horizontalPosition: 'right', verticalPosition: 'top' });
        untracked(() => this.serviceService.setMessageChange(''));
      }
    });
  }

  saveNewService() {
    const form = this.$newSvcForm();
    if (form.invalid) { form.markAllAsTouched(); return; }
    const svc = form.value as AdditionalService;
    this.$isSaving.set(true);
    this.serviceService.save(svc).pipe(
      switchMap(() => this.serviceService.findAll()),
      tap(data => this.serviceService.setListChange(data)),
      tap(() => this.serviceService.setMessageChange('CREATED')),
      finalize(() => this.$isSaving.set(false))
    ).subscribe({
      next: () => { this.$newSvcForm.set(this.buildForm()); this.$showForm.set(false); }
    });
  }

  applyFilter(e: Event) {
    const filterValue = (e.target as HTMLInputElement).value;
    this.$dataSource().filter = filterValue.trim().toLowerCase();
  }

  toggleAvailability(svc: AdditionalService) {
    const updated: AdditionalService = { ...svc, availableDto: !svc.availableDto };
    this.serviceService.update(svc.idService!, updated).pipe(
      switchMap(() => this.serviceService.findAll()),
      tap(data => this.serviceService.setListChange(data)),
      tap(() => this.serviceService.setMessageChange(updated.availableDto ? 'DISPONIBLE' : 'NO DISPONIBLE'))
    ).subscribe();
  }

  delete(idService: number) {
    this.dialog.open(ConfirmDialogComponent).afterClosed().pipe(
      filter(result => result),
      switchMap(() => this.serviceService.delete(idService)),
      switchMap(() => this.serviceService.findAll()),
      tap(data => this.serviceService.setListChange(data)),
      tap(() => this.serviceService.setMessageChange('DELETED'))
    ).subscribe();
  }
}
