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
import { Room } from '../../model/room';
import { RoomService } from '../../services/room.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-room-manager',
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
  templateUrl: './room-manager.component.html',
  styleUrl: './room-manager.component.css',
})
export class RoomManagerComponent {
  private readonly roomService = inject(RoomService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected $dataSource = signal(new MatTableDataSource<Room>());
  protected displayedColumns: string[] = ['idRoom', 'numberDto', 'typeDto', 'priceDto', 'availableDto', 'actions'];
  protected $rooms = this.roomService.$listChange;

  protected $paginator = viewChild(MatPaginator);
  protected $sort = viewChild(MatSort);

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

  delete(idRoom: number) {    this.dialog.open(ConfirmDialogComponent).afterClosed().pipe(
      filter(result => result),
      switchMap(() => this.roomService.delete(idRoom)),
      switchMap(() => this.roomService.findAll()),
      tap(data => this.roomService.setListChange(data)),
      tap(() => this.roomService.setMessageChange('DELETED'))
    ).subscribe();
  }
}
