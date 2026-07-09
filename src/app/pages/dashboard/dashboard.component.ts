import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, SlicePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoginService } from '../../services/login.service';
import { RoomService } from '../../services/room.service';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, RouterLink, CurrencyPipe, DatePipe, SlicePipe, TitleCasePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly loginService      = inject(LoginService);
  private readonly roomService       = inject(RoomService);
  private readonly reservationService = inject(ReservationService);

  protected $userInfo     = toSignal(this.loginService.showUserInfo(),       { initialValue: { username: '', roles: [] as string[] } });
  protected $rooms        = toSignal(this.roomService.findAll(),              { initialValue: [] });
  protected $reservations = toSignal(this.reservationService.findAll(),       { initialValue: [] });

  protected $availableRooms = computed(() => this.$rooms().filter(r => r.availableDto).length);
  protected $occupiedRooms  = computed(() => this.$rooms().filter(r => !r.availableDto).length);

  protected $totalRes = computed(() => this.$reservations().length);

  protected $pendingRes = computed(() =>
    this.$reservations().filter(r => new Date(r.checkInDate) > new Date()).length
  );

  protected $activeRes = computed(() => {
    const now = new Date();
    return this.$reservations().filter(r =>
      new Date(r.checkInDate) <= now && new Date(r.checkOutDate) >= now
    ).length;
  });

  protected $revenue = computed(() =>
    this.$reservations().reduce((sum, r) => {
      if (!r.room?.priceDto) return sum;
      const nights = Math.max(1, Math.round(
        (new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime())
        / (1000 * 60 * 60 * 24)
      ));
      return sum + nights * r.room.priceDto;
    }, 0)
  );

  protected $recentActivity = computed(() =>
    [...this.$reservations()]
      .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime())
      .slice(0, 4)
  );

  protected $roomsByType = computed(() => {
    const rooms = this.$rooms();
    const map = new Map<string, { total: number; occupied: number }>();
    for (const r of rooms) {
      const entry = map.get(r.typeDto) ?? { total: 0, occupied: 0 };
      entry.total++;
      if (!r.availableDto) entry.occupied++;
      map.set(r.typeDto, entry);
    }
    return Array.from(map.entries()).map(([type, data]) => ({ type, ...data }));
  });

  protected today = new Date();

  protected isActive(checkIn: string, checkOut: string): boolean {
    const now = new Date();
    return new Date(checkIn) <= now && new Date(checkOut) >= now;
  }
}
