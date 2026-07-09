import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { LoginService } from '../../services/login.service';
import { MenuService } from '../../services/menu.service';
import { ThemeService } from '../../services/theme.service';
import { AccountDialogComponent } from '../account-dialog/account-dialog.component';

const ROUTE_TITLES: Record<string, string> = {
  'dashboard':           'Dashboard',
  'room-manager':        'Habitaciones',
  'reservation-manager': 'Reservas',
  'report':              'Reportes',
  'service-manager':     'Servicios',
};

@Component({
  selector: 'app-layout',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  private readonly loginService = inject(LoginService);
  private readonly router       = inject(Router);
  private readonly menuService  = inject(MenuService);
  private readonly dialog       = inject(MatDialog);
  protected readonly theme      = inject(ThemeService);

  protected $menus     = toSignal(this.menuService.getMenusByUser(), { initialValue: [] });
  protected $collapsed = signal(false);

  /* ── Toolbar title derived from active route ── */
  protected $pageTitle = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => this.titleFor((e as NavigationEnd).url)),
      startWith(this.titleFor(this.router.url)),
    ),
    { initialValue: 'Dashboard' }
  );

  /* ── Categorised menu signals (mutually exclusive by exact path segment) ── */
  private get $uniqueMenus() {
    const seen = new Set<string>();
    return this.$menus().filter(m => {
      const key = m.url ?? String(m.idMenu);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  protected $menuPrincipal = computed(() =>
    this.$uniqueMenus.filter(m => m.url?.includes('dashboard'))
  );
  protected $menuGestion = computed(() =>
    this.$uniqueMenus.filter(m =>
      m.url?.includes('room-manager') ||
      m.url?.includes('reservation-manager') ||
      m.url?.includes('service-manager')
    )
  );
  protected $menuAnalisis = computed(() =>
    this.$uniqueMenus.filter(m => m.url?.includes('report'))
  );

  toggleSidebar() { this.$collapsed.update(v => !v); }

  openAccount() { this.dialog.open(AccountDialogComponent, { width: '420px' }); }

  logout() {
    this.loginService.logout().subscribe();
    this.router.navigate(['login']);
  }

  private titleFor(url: string): string {
    const key = Object.keys(ROUTE_TITLES).find(k => url.includes(k));
    return key ? ROUTE_TITLES[key] : 'HOTELAPP';
  }
}
