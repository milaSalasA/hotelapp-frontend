import { Service } from '@angular/core';
import { Reservation } from '../model/reservation';
import { GenericService } from './generic.service';
import { environment } from '../../environments/environment.development';

@Service()
export class ReservationService extends GenericService<Reservation> {

    protected override url: string = `${environment.HOST}/v1/reservations`;
    
}
