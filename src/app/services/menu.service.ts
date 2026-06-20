import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Menu } from '../model/menu';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class MenuService {

  private readonly http = inject(HttpClient);

  getMenusByUser(){
    return this.http.post<Menu[]>(`${environment.HOST}/v1/menus/user`, {});
  }

}
