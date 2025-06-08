import { Component, input, OnInit, output, signal } from '@angular/core';
import { RoomService } from '../services/room.service';
import { FormsModule } from '@angular/forms';
import { Room } from '../domain/room';

@Component({
  selector: 'chat-room-selector',
  templateUrl: './chat-room-selector.html',
  styleUrl: './chat-room-selector.css',
  imports: [FormsModule]
})
export class ChatRoomSelector implements OnInit {
  public newRoomName?: string;
  public selectedRoom = output<Room>();

  public rooms = signal<Room[]>([]);
  constructor(public roomService: RoomService) {
  }

  ngOnInit(): void {
    this.roomService.getRooms().subscribe((rooms: Room[]) => {
      this.rooms.set(rooms);
    });
  }

  public setRoom(room: Room): void {
    this.selectedRoom.emit(room);
  }

  public addRoom() {
    if (this.newRoomName) {
      this.roomService.addRoom(this.newRoomName).subscribe((result) => {

        if (!result.IsSuccesfull) {
          console.error('Failed to add room:', result.Error);
          return;
        }

        this.rooms.update(rooms => [...rooms, new Room(result.Value!.Id, this.newRoomName!)]);
        this.newRoomName = '';
      });
    }
  }

}
