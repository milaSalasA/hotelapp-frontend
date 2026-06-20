import { Service } from '@angular/core';
import { GenericSignalService } from './generic-signal.service';
import { Room } from '../model/room';
import { environment } from '../../environments/environment.development';

@Service()
export class RoomService extends GenericSignalService<Room> {

    protected override url: string = `${environment.HOST}/v1/rooms`;

}
