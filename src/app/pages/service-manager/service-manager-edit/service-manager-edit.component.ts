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
import { AdditionalService, ServiceCategory } from '../../../model/additional-service';
import { AdditionalServiceService } from '../../../services/additional-service.service';

@Component({
  selector: 'app-service-manager-edit',
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
  templateUrl: './service-manager-edit.component.html',
  styleUrl: './service-manager-edit.component.css',
})
export class ServiceManagerEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly serviceService = inject(AdditionalServiceService);

  protected readonly categories: { value: ServiceCategory; label: string }[] = [
    { value: 'FOOD', label: 'Comida' },
    { value: 'BEVERAGE', label: 'Bebida' },
    { value: 'PERSONAL_CARE', label: 'Cuidado Personal' },
    { value: 'OTHER', label: 'Otro' },
  ];

  protected $form = signal(new FormGroup({
    idService: new FormControl<number | null>(null),
    nameDto: new FormControl<string>('', [Validators.required, Validators.minLength(2)]),
    descriptionDto: new FormControl<string>(''),
    priceDto: new FormControl<number>(0, [Validators.required, Validators.min(0)]),
    categoryDto: new FormControl<ServiceCategory | null>(null, [Validators.required]),
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
        this.serviceService.findById(+id).subscribe(data => this.$form().patchValue(data));
      }
    });
  }

  operate() {
    const form = this.$form();
    if (form.invalid) return;

    const svc = form.value as AdditionalService;
    const isEdit = this.$isEdit();
    const operation$ = isEdit
      ? this.serviceService.update(+this.$id(), svc)
      : this.serviceService.save(svc);

    operation$.pipe(
      switchMap(() => this.serviceService.findAll()),
      tap(data => this.serviceService.setListChange(data)),
      tap(() => this.serviceService.setMessageChange(isEdit ? 'UPDATED' : 'CREATED'))
    ).subscribe(() => {
      this.router.navigate(['/pages/service-manager']);
    });
  }
}
