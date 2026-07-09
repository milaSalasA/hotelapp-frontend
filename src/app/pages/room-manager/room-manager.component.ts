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
import { Room } from '../../model/room';
import { RoomService } from '../../services/room.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { RoomPhotosDialogComponent } from './room-photos-dialog/room-photos-dialog.component';

@Component({
  selector: 'app-room-manager',
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
  templateUrl: './room-manager.component.html',
  styleUrl: './room-manager.component.css',
})
export class RoomManagerComponent {
  private readonly roomService = inject(RoomService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected $dataSource = signal(new MatTableDataSource<Room>());
  protected displayedColumns: string[] = ['idRoom', 'numberDto', 'typeDto', 'priceDto', 'availableDto', 'photos', 'actions'];
  protected $rooms = this.roomService.$listChange;

  protected $availableCount = computed(() => this.$rooms().filter(r =>  r.availableDto).length);
  protected $occupiedCount  = computed(() => this.$rooms().filter(r => !r.availableDto).length);

  protected $paginator = viewChild(MatPaginator);
  protected $sort = viewChild(MatSort);

  // ── Inline new-room form ──────────────────────────────────────────────────
  protected readonly roomTypes = ['Single', 'Double', 'Suite', 'Deluxe', 'Family'];
  protected $showForm  = signal(false);
  protected $isSaving  = signal(false);

  protected $newRoomForm = signal(this.buildForm());
  protected $nf = computed(() => this.$newRoomForm().controls);

  protected buildForm() {
    return new FormGroup({
      numberDto:    new FormControl<string>('', [Validators.required]),
      typeDto:      new FormControl<string>('', [Validators.required]),
      priceDto:     new FormControl<number>(0, [Validators.required, Validators.min(0)]),
      availableDto: new FormControl<boolean>(true),
    });
  }

  constructor() {
    this.roomService.findAll().subscribe(data => this.roomService.setListChange(data));
    this.initializeEffects();
  }

  private initializeEffects() {
    effect(() => {
      const data = this.$rooms();
      const ds = this.$dataSource();
      ds.data = data;
      ds.paginator = this.$paginator();
      ds.sort = this.$sort();
    });

    effect(() => {
      const message = this.roomService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'INFO', { duration: 2000, horizontalPosition: 'right', verticalPosition: 'top' });
        untracked(() => this.roomService.setMessageChange(''));
      }
    });
  }

  saveNewRoom() {
    const form = this.$newRoomForm();
    if (form.invalid) { form.markAllAsTouched(); return; }
    const room = form.value as Room;
    this.$isSaving.set(true);
    this.roomService.save(room).pipe(
      switchMap(() => this.roomService.findAll()),
      tap(data => this.roomService.setListChange(data)),
      tap(() => this.roomService.setMessageChange('CREATED')),
      finalize(() => this.$isSaving.set(false))
    ).subscribe({
      next: () => { this.$newRoomForm.set(this.buildForm()); this.$showForm.set(false); }
    });
  }

  applyFilter(e: Event) {
    const filterValue = (e.target as HTMLInputElement).value;
    this.$dataSource().filter = filterValue.trim().toLowerCase();
  }

  toggleAvailability(room: Room) {
    const updated: Room = { ...room, availableDto: !room.availableDto };
    this.roomService.update(room.idRoom, updated).pipe(
      switchMap(() => this.roomService.findAll()),
      tap(data => this.roomService.setListChange(data)),
      tap(() => this.roomService.setMessageChange(updated.availableDto ? 'DISPONIBLE' : 'NO DISPONIBLE'))
    ).subscribe();
  }

  openPhotos(room: Room) {
    this.dialog.open(RoomPhotosDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      data: { roomId: room.idRoom, roomNumber: room.numberDto },
    });
  }

  delete(idRoom: number) {
    this.dialog.open(ConfirmDialogComponent).afterClosed().pipe(
      filter(result => result),
      switchMap(() => this.roomService.delete(idRoom)),
      switchMap(() => this.roomService.findAll()),
      tap(data => this.roomService.setListChange(data)),
      tap(() => this.roomService.setMessageChange('DELETED'))
    ).subscribe();
  }
}
