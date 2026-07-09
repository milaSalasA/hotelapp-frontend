import { certGuard } from '../guard/cert.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { Not403Component } from './not-403/not-403.component';
import { ReportComponent } from './report/report.component';
import { ReservationManagerComponent } from './reservation-manager/reservation-manager.component';
import { RoomManagerComponent } from './room-manager/room-manager.component';
import { RoomManagerEditComponent } from './room-manager/room-manager-edit/room-manager-edit.component';
import { ServiceManagerComponent } from './service-manager/service-manager.component';
import { ServiceManagerEditComponent } from './service-manager/service-manager-edit/service-manager-edit.component';

export const pagesRoutes = [
  { path: 'dashboard', component: DashboardComponent, canActivate: [certGuard] },
  {
    path: 'room-manager',
    component: RoomManagerComponent,
    children: [
      { path: 'new', component: RoomManagerEditComponent },
      { path: 'edit/:id', component: RoomManagerEditComponent },
    ],
    canActivate: [certGuard]
  },
  { path: 'reservation-manager', component: ReservationManagerComponent, canActivate: [certGuard] },
  { path: 'report', component: ReportComponent, canActivate: [certGuard] },
  {
    path: 'service-manager',
    component: ServiceManagerComponent,
    children: [
      { path: 'new', component: ServiceManagerEditComponent },
      { path: 'edit/:id', component: ServiceManagerEditComponent },
    ],
    canActivate: [certGuard]
  },
  { path: 'not-403', component: Not403Component },
];
