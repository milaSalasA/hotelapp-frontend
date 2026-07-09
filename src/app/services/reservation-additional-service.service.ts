import { Injectable } from '@angular/core';
import { GenericSignalService } from './generic-signal.service';
import { ReservationAdditionalService } from '../model/reservation-additional-service';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ReservationAdditionalServiceService extends GenericSignalService<ReservationAdditionalService> {
  protected override url = `${environment.HOST}/v1/reservation-services`;

  findByReservation(reservationId: number) {
    return this.http.get<ReservationAdditionalService[]>(`${this.url}/reservation/${reservationId}`);
  }
}
