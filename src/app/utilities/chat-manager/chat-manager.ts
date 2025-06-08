import { Component, signal } from '@angular/core';
import { ChatRoomSelector } from './chat-room-selector/chat-room-selector';
import { Chat } from './chat/chat';
import { Room } from './domain/room';

@Component({
  selector: 'app-chat-manager',
  imports: [ChatRoomSelector, Chat],
  templateUrl: './chat-manager.html',
  styleUrl: './chat-manager.css'
})
export class ChatManager {
  public userName = signal<string>('Alfonsito el  mas guapito');
  public selectedRoom = signal<Room | null>(null);

  public setRoom(room: Room) {
    this.selectedRoom.set(room);
    console.log(`Selected room de veras: ${room}`);
  }
}
