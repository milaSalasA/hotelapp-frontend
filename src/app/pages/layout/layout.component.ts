import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { MenuService } from '../../services/menu.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-layout',
  imports: [
    MatButtonModule, 
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterLinkActive,
    RouterLink,
    RouterOutlet
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {

  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly menuService = inject(MenuService);

  protected $menus = toSignal(this.menuService.getMenusByUser(), { initialValue: [] });

  logout(){
    this.loginService.logout().subscribe();
    this.router.navigate(['login']);
  }
}
