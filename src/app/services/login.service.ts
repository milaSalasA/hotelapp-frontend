import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

interface ILoginRequest{
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {

  private url: string = `${environment.HOST}/login`;

  private http = inject(HttpClient);

  login(username: string, password: string) {
    const body: ILoginRequest = { username, password };

    return this.http.post<any>(this.url, body);
  }

  logout(){        
    return this.http.get(`${environment.HOST}/auth/logout`);
  }

  showUserInfo(){
    return this.http.get<{ username: string; roles: string[] }>(`${environment.HOST}/auth/user`);
  }


  //correos
   sendMail(email: string) {
    return this.http.post<number>(`${environment.HOST}/mail/sendMail`, email, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  checkRandomReset(random: string){
    return this.http.get<number>(`${environment.HOST}/mail/reset/check/${random}`);
  }

  resetPassword(random: string, newPassword: string) {
    return this.http.post<number>(
      `${environment.HOST}/mail/reset/${random}`, newPassword, { headers: new HttpHeaders().set('Content-Type', 'text/plain') } 
    );
  }


}
