import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, EMPTY, Observable, retry, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ServerErrorInterceptor implements HttpInterceptor {
 
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next
      .handle(req)
      .pipe(retry(environment.RETRY))
      .pipe(
        tap((event) => {
          if (event instanceof HttpResponse) {            
            if (event.body && event.body.error === true && event.body.errorMessage) {
              throw new Error(event.body.errorMessage);
            }
          }
        })
      )
      .pipe(
        catchError((err) => {
          if (err.status === 400) {
            this.snackBar.open(err.message, 'ERROR 400', { duration: 5000 });
          } else if (err.status === 404) {
            this.snackBar.open('No existe el recurso', 'ERROR 404', { duration: 5000 });
          } else if (err.status === 401) {
            this.snackBar.open('No autorizado', 'ERROR 401', { duration: 5000 });
            this.router.navigate(['/login']);
          } else if (err.status === 500) {
            this.snackBar.open(err.error.message, 'ERROR 500', { duration: 5000 });
          } else {
            this.snackBar.open(err.error.message, 'ERROR', { duration: 5000 });
          }

          return EMPTY;
        })
      );
  }
}
