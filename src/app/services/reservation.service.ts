import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Reservation } from '../model/reservation';
import { GenericSignalService } from './generic-signal.service';
import { environment } from '../../environments/environment.development';

@Injectable({
    providedIn: 'root',
})
export class ReservationService extends GenericSignalService<Reservation> {
    protected override url: string = `${environment.HOST}/v1/reservations`;

    searchByCustomer(name: string) {
        const params = new HttpParams().set('name', name);
        return this.http.get<Reservation[]>(`${this.url}/search/customer`, { params });
    }

    searchByDates(startDate: string, endDate: string) {
        const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
        return this.http.get<Reservation[]>(`${this.url}/search/dates`, { params });
    }

    checkConflicts(roomId: number, checkIn: string, checkOut: string) {
        const params = new HttpParams()
            .set('roomId', roomId)
            .set('checkIn', checkIn)
            .set('checkOut', checkOut);
        return this.http.get<Reservation[]>(`${this.url}/check-conflicts`, { params });
    }

    generateReport() {
        return this.http.get(`${this.url}/generateReport`, { responseType: 'blob' });
    }

    saveFile(file: File){
      const formData = new FormData();
      formData.append('file', file);

      return this.http.post<number>(`${this.url}/saveFile`, formData);
    }

    readFile(id: number){
      return this.http.get(`${this.url}/readFile/${id}`, { responseType: 'text' });
    }
}
