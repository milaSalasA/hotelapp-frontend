import { AdditionalService } from './additional-service';

export class ReservationAdditionalService {
    idReservationService?: number;
    reservationId: number;
    additionalService: AdditionalService;
    quantityDto: number;
    totalPriceDto?: number;
    requestDateDto?: string;
    notesDto?: string;
}
