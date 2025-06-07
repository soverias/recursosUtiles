import { Component, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr'
@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat implements OnInit {

  public chatRoom = input.required<string>();

  public userName = input.required<string>();

  public messageToSend = signal<string>('');

  public conversation = signal<NewMessage[]>([{
    message: 'Bienvenido',
    userName: 'Sistema'
  }]);

  private connection: HubConnection;

  constructor() {
    this.connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5253/chathub')
      .build();

    this.connection.on("NewUser", message => this.newUser(message));
    this.connection.on("NewMessage", message => this.newMessage(message));
    this.connection.on("LeftUser", message => this.leftUser(message));
  }


  ngOnInit(): void {
    this.connection.start()
      .then(_ => {
        this.join();
      }).catch(error => {
        return console.error(error);
      });
  }

  public join() {
    this.connection.invoke('JoinGroup', this.chatRoom(), this.userName)
      .then(_ => {
        console.log(`Joined group: ${this.chatRoom()}`);
      });
  }


  public sendMessage() {
    const newMessage: NewMessage = {
      message: this.messageToSend(),
      userName: this.userName(),
      groupName: this.chatRoom()
    };

    this.connection.invoke('SendMessage', newMessage)
      .then(_ => {
        this.messageToSend.set('');
      });
  }

  public leave() {
    // this.connection.invoke('LeaveGroup', this.groupName, this.userName)
    //   .then(_ => {
    //     this.joined.set(false);
    //   });
  }

  private newUser(message: string) {
    console.log(message);
    this.conversation.update(values => {
      return [...values, {
      userName: 'Sistema',
      message: message
    }];
   });
  }

  private newMessage(message: NewMessage) {
    this.conversation.update(values => {
      return [...values, message];
    });
  }

  private leftUser(message: string) {
    // this.conversation.push({
    //   userName: 'Sistema',
    //   message: message
    // });
    // this.cdr.detectChanges();
  }

}

interface NewMessage {
  userName: string;
  message: string;
  groupName?: string;
}
