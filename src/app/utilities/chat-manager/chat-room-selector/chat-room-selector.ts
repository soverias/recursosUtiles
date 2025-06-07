import { Component, input, OnInit, output, signal } from '@angular/core';
import { RoomService } from '../services/room';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'chat-room-selector',
  templateUrl: './chat-room-selector.html',
  styleUrl: './chat-room-selector.css',
  imports: [FormsModule]
})
export class ChatRoomSelector implements OnInit {
  public newRoom?: string;
  public selectedRoom = output<string>();

  public rooms = signal<string[]>([]);

  constructor(public roomService: RoomService) {
  }

  ngOnInit(): void {
    this.roomService.getRooms().subscribe((rooms: string[]) => {
      this.rooms.set(rooms);
    });
  }

  public setRoom(room: string): void {
    this.selectedRoom.emit(room);
  }

  public addRoom() {
    if (this.newRoom) {
      this.roomService.addRoom(this.newRoom).subscribe(() => {
        this.rooms.update(rooms => [...rooms, this.newRoom!]);
        this.newRoom = '';
      });
    }
  }

}
