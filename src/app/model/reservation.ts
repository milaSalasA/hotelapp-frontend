import { Room } from "./room";

export class Reservation {
    idReservation?: number;
    customerName: string;
    checkInDate: string;
    checkOutDate: string;
    room: Room;
}
