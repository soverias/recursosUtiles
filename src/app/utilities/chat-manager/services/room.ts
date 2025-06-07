import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoomService {

  constructor() {}
  private http = inject(HttpClient);

  getRooms(): Observable<string[]> {
    console.log('Fetching chat rooms from the server...');
    return this.http.get<string[]>('http://localhost:5253/api/rooms');
  }
  addRoom(roomName: string): Observable<void> {
    console.log(`Adding new chat room: ${roomName}`);
    return this.http.post<void>('http://localhost:5253/api/rooms/'+roomName, null);
  }
}
