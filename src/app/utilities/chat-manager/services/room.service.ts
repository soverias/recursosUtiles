import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Room } from '../domain/room';

@Injectable({
  providedIn: 'root',
})
export class RoomService {

  constructor() { }
  private http = inject(HttpClient);

  getRooms(): Observable<Room[]> {
    console.log('Fetching chat rooms from the server...');
    return this.http.get<Room[]>('http://localhost:5253/api/rooms');
  }

  addRoom(roomName: string): Observable<ResultHandler<CreateRoomResponse>> {
    console.log(`Adding new chat room: ${roomName}`);
    return this.http.post<ResultHandler<CreateRoomResponse>>('http://localhost:5253/api/rooms/', { RoomName: roomName });
  }
}
interface CreateRoomResponse {
  Id: string;
}
