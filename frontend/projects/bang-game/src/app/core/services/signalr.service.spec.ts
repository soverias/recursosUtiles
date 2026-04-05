import { TestBed } from '@angular/core/testing';
import { HubConnection } from '@microsoft/signalr';
import { SignalRService } from './signalr.service';

const makeHubStub = () => ({
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  off: vi.fn(),
  invoke: vi.fn().mockResolvedValue(undefined),
  onclose: vi.fn(),
  onreconnecting: vi.fn(),
  onreconnected: vi.fn(),
} as unknown as HubConnection);

describe('SignalRService', () => {
  let service: SignalRService;
  let hub: ReturnType<typeof makeHubStub>;

  beforeEach(() => {
    hub = makeHubStub();
    TestBed.configureTestingModule({ providers: [SignalRService] });
    service = TestBed.inject(SignalRService);
    service.hubFactory = () => hub;
  });

  it('isConnected starts as false', () => {
    expect(service.isConnected()).toBe(false);
  });

  it('connect calls hub.start and sets isConnected to true', async () => {
    await service.connect('/hubs/game');
    expect(hub.start).toHaveBeenCalledOnce();
    expect(service.isConnected()).toBe(true);
  });

  it('disconnect calls hub.stop and sets isConnected to false', async () => {
    await service.connect('/hubs/game');
    await service.disconnect();
    expect(hub.stop).toHaveBeenCalledOnce();
    expect(service.isConnected()).toBe(false);
  });

  it('on registers a handler on the hub', async () => {
    await service.connect('/hubs/game');
    const handler = vi.fn();
    service.on('Bang', handler);
    expect(hub.on).toHaveBeenCalledWith('Bang', handler);
  });

  it('invoke calls hub.invoke with method', async () => {
    await service.connect('/hubs/game');
    await service.invoke('SendReady');
    expect(hub.invoke).toHaveBeenCalledWith('SendReady');
  });

  // TRIANGULATE: invoke with arguments
  it('invoke passes additional arguments to hub.invoke', async () => {
    await service.connect('/hubs/game');
    await service.invoke('JoinRoom', 'room-42');
    expect(hub.invoke).toHaveBeenCalledWith('JoinRoom', 'room-42');
  });
});
