import { Component, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { filter, switchMap, tap } from 'rxjs';
import { AdditionalService } from '../../model/additional-service';
import { AdditionalServiceService } from '../../services/additional-service.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-service-manager',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
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
