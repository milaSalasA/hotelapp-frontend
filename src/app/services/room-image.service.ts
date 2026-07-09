import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { RoomImage } from '../model/room-image';

@Injectable({ providedIn: 'root' })
export class RoomImageService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.HOST}/v1/rooms`;

  findByRoom(roomId: number): Observable<RoomImage[]> {
    return this.http.get<RoomImage[]>(`${this.baseUrl}/${roomId}/images`);
  }

  saveUrl(roomId: number, url: string, fileName = 'photo.jpg'): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/${roomId}/images`, {
      url,
      fileName,
      fileType: 'image/jpeg',
    });
  }

  delete(roomId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${roomId}/images/${imageId}`);
  }
}
