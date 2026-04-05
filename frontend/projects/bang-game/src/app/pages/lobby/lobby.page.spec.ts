import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { LobbyPage } from './lobby.page';
import { GameHubService } from '../../core/services/game-hub.service';
import { GameStateService } from '../game/game-state.service';
import { AuthService } from '../../core/services/auth.service';
import { RoomInfo } from '../../core/models/room.model';

const makeGameHubStub = () => ({
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  joinRandom: vi.fn().mockResolvedValue(undefined),
  joinPrivate: vi.fn().mockResolvedValue(undefined),
  createPrivateRoom: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
});

const makeAuthStub = () => ({
  currentUser: signal({ kind: 'guest', user: { id: 'g1', username: 'Invitado_AA' } } as const),
});

describe('LobbyPage', () => {
  let fixture: ComponentFixture<LobbyPage>;
  let hub: ReturnType<typeof makeGameHubStub>;
  let gameState: GameStateService;
  let router: Router;

  beforeEach(() => {
    hub = makeGameHubStub();
    TestBed.configureTestingModule({
      imports: [LobbyPage],
      providers: [
        provideRouter([]),
        { provide: GameHubService, useValue: hub },
        { provide: AuthService, useValue: makeAuthStub() },
        GameStateService,
      ],
    });
    fixture = TestBed.createComponent(LobbyPage);
    gameState = TestBed.inject(GameStateService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('renders "Jugar ahora" button', () => {
    expect(fixture.nativeElement.querySelector('[data-join-random]')).not.toBeNull();
  });

  it('renders "Crear sala privada" button', () => {
    expect(fixture.nativeElement.querySelector('[data-create-private]')).not.toBeNull();
  });

  it('"Jugar ahora" calls hub.joinRandom', () => {
    fixture.nativeElement.querySelector('[data-join-random]').click();
    expect(hub.joinRandom).toHaveBeenCalledOnce();
  });

  it('"Crear sala privada" calls hub.createPrivateRoom', () => {
    fixture.nativeElement.querySelector('[data-create-private]').click();
    expect(hub.createPrivateRoom).toHaveBeenCalledOnce();
  });

  it('shows room code after private room creation via OpponentJoined event', async () => {
    // Simulate server sending RoomCreated with code
    const roomInfo: RoomInfo = { roomId: 'r1', code: 'XYZ789', opponentUsername: '' };
    gameState.opponentJoined(roomInfo);
    fixture.detectChanges();
    const codeEl = fixture.nativeElement.querySelector('[data-room-code]');
    expect(codeEl).not.toBeNull();
    expect(codeEl.textContent).toContain('XYZ789');
  });

  it('join private code input and button are rendered', () => {
    expect(fixture.nativeElement.querySelector('[data-code-input]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-join-private]')).not.toBeNull();
  });

  it('join private calls hub.joinPrivate with entered code', () => {
    const input = fixture.nativeElement.querySelector('[data-code-input]');
    input.value = 'ABC123';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-join-private]').click();
    expect(hub.joinPrivate).toHaveBeenCalledWith('ABC123');
  });

  it('shows "Sala no encontrada" error when joinPrivate fails', async () => {
    hub.joinPrivate.mockRejectedValue(new Error('not found'));
    const input = fixture.nativeElement.querySelector('[data-code-input]');
    input.value = 'XXXXXX';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-join-private]').click();
    await fixture.whenStable();
    fixture.detectChanges();
    const err = fixture.nativeElement.querySelector('[data-error]');
    expect(err).not.toBeNull();
    expect(err.textContent).toContain('Sala no encontrada');
  });
});
