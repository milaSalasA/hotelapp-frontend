import { certGuard } from "../guard/cert.guard";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { Not403Component } from "./not-403/not-403.component";
import { ReportComponent } from "./report/report.component";
import { RoomManagerComponent } from "./room-manager/room-manager.component";
import { SearchComponent } from "./search/search.component";

export const pagesRoutes = [
{ path: 'dashboard', component: DashboardComponent, canActivate: [certGuard] },
{
    path: 'room-manager',
    component: RoomManagerComponent,
    children: [
      { path: 'new', component: RoomManagerEditComponent },
      { path: 'edit/:id', component: RoomManagerEditComponent },
    ], canActivate: [certGuard]
  },
  { path: 'room', component: RoomManagerComponent, canActivate: [certGuard] },
  { path: 'search', component: SearchComponent, canActivate: [certGuard] },
  { path: 'report', component: ReportComponent, canActivate: [certGuard] },
  { path: 'not-403', component: Not403Component }  
];