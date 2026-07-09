import { Injectable } from '@angular/core';
import { GenericSignalService } from './generic-signal.service';
import { AdditionalService } from '../model/additional-service';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AdditionalServiceService extends GenericSignalService<AdditionalService> {
  protected override url = `${environment.HOST}/v1/services`;
}
