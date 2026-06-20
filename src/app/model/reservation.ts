import { Room } from "./room";

export class Reservation {
    idReservation: number;
    customerName: string;
    checkInDate: Date;
    checkOutDate: Date;
    room: Room;
}