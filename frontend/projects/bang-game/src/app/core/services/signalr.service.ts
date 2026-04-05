import { Injectable, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hub: HubConnection | null = null;

  readonly isConnected = signal(false);

  /** Overridable in tests to inject a stub hub */
  hubFactory: (url: string) => HubConnection = (url) =>
    new HubConnectionBuilder()
      .withUrl(url)
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

  async connect(url: string): Promise<void> {
    this.hub = this.hubFactory(url);
    this.hub.onclose(() => this.isConnected.set(false));
    this.hub.onreconnecting(() => this.isConnected.set(false));
    this.hub.onreconnected(() => this.isConnected.set(true));

    await this.hub.start();
    this.isConnected.set(true);
  }

  async disconnect(): Promise<void> {
    await this.hub?.stop();
    this.isConnected.set(false);
  }

  on<T>(event: string, handler: (data: T) => void): void {
    this.hub?.on(event, handler);
  }

  off(event: string): void {
    this.hub?.off(event);
  }

  async invoke(method: string, ...args: unknown[]): Promise<void> {
    await this.hub?.invoke(method, ...args);
  }
}
