import { inject, Injectable } from '@angular/core';
import { SignalRService } from './signalr.service';
import { HUB_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class GameHubService {
  private readonly signalr = inject(SignalRService);

  async connect(): Promise<void> {
    await this.signalr.connect(HUB_URL);
  }

  async disconnect(): Promise<void> {
    await this.signalr.disconnect();
  }

  on<T>(event: string, handler: (data: T) => void): void {
    this.signalr.on(event, handler);
  }

  async joinRandom(): Promise<void> {
    await this.signalr.invoke('JoinRandom');
  }

  async joinPrivate(code: string): Promise<void> {
    await this.signalr.invoke('JoinPrivate', code);
  }

  async createPrivateRoom(): Promise<void> {
    await this.signalr.invoke('CreatePrivateRoom');
  }

  async sendReady(): Promise<void> {
    await this.signalr.invoke('SendReady');
  }

  async sendTap(): Promise<void> {
    await this.signalr.invoke('SendTap');
  }

  async repeat(): Promise<void> {
    await this.signalr.invoke('Repeat');
  }

  async leaveRoom(): Promise<void> {
    await this.signalr.invoke('LeaveRoom');
  }
}
