import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { LobbyPage } from './lobby.page';
import { GameHubService } from '../../core/services/game-hub.service';
import { GameStateService } from '../game/game-state.service';
import { AuthService } from '../../core/services/auth.service';
import { BotSessionService } from '../../core/services/bot-session.service';
import { MatchmakingTimeoutService } from '../../core/services/matchmaking-timeout.service';
import { RoomInfo } from '../../core/models/room.model';

const makeGameHubStub = () => ({
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  joinRandom: vi.fn().mockResolvedValue(undefined),
  joinPrivate: vi.fn().mockResolvedValue(undefined),
  createPrivateRoom: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  leaveRoom: vi.fn().mockResolvedValue(undefined),
});

const makeAuthStub = () => ({
  currentUser: signal({ kind: 'guest', user: { id: 'g1', username: 'Invitado_AA' } } as const),
  login: vi.fn().mockReturnValue(of({ id: 'u1', username: 'alice', token: 'jwt' })),
  register: vi.fn().mockReturnValue(of({ id: 'u1', username: 'alice', token: 'jwt' })),
  logout: vi.fn(),
});

const makeBotSessionStub = () => ({
  isBotGame: signal(false),
  difficulty: signal<'easy' | 'medium' | 'hard'>('medium'),
  opponentName: signal('Pistolero'),
  startBotSession: vi.fn(),
  endBotSession: vi.fn(),
});

const makeMatchmakingTimeoutStub = () => ({
  expired: signal(false),
  start: vi.fn(),
  cancel: vi.fn(),
});

describe('LobbyPage', () => {
  let fixture: ComponentFixture<LobbyPage>;
  let hub: ReturnType<typeof makeGameHubStub>;
  let gameState: GameStateService;
  let auth: ReturnType<typeof makeAuthStub>;
  let router: Router;
  let botSession: ReturnType<typeof makeBotSessionStub>;
  let matchmakingTimeout: ReturnType<typeof makeMatchmakingTimeoutStub>;

  beforeEach(() => {
    hub = makeGameHubStub();
    auth = makeAuthStub();
    botSession = makeBotSessionStub();
    matchmakingTimeout = makeMatchmakingTimeoutStub();
    TestBed.configureTestingModule({
      imports: [LobbyPage],
      providers: [
        provideRouter([]),
        { provide: GameHubService, useValue: hub },
        { provide: AuthService, useValue: auth },
        { provide: BotSessionService, useValue: botSession },
        { provide: MatchmakingTimeoutService, useValue: matchmakingTimeout },
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
    const roomInfo: RoomInfo = { roomId: 'r1', code: 'XYZ789', opponentUsername: '', myUsername: '' };
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

  // --- Bot session cleanup on init ---

  it('llama botSession.endBotSession() en ngOnInit como red de seguridad', () => {
    expect(botSession.endBotSession).toHaveBeenCalledOnce();
  });

  // --- Matchmaking timeout ---

  it('llama matchmakingTimeout.start(30_000) al hacer joinRandom', async () => {
    fixture.nativeElement.querySelector('[data-join-random]').click();
    await fixture.whenStable();
    expect(matchmakingTimeout.start).toHaveBeenCalledWith(30_000);
  });

  it('llama matchmakingTimeout.cancel() al recibir OpponentJoined', async () => {
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
    const opponentJoinedCall = hub.on.mock.calls.find((args: unknown[]) => args[0] === 'OpponentJoined');
    expect(opponentJoinedCall).toBeDefined();
    const callback = opponentJoinedCall![1] as (room: RoomInfo) => void;
    const room: RoomInfo = { roomId: 'r2', opponentUsername: 'Rival', myUsername: 'Me' };
    callback(room);
    expect(matchmakingTimeout.cancel).toHaveBeenCalled();
  });

  // --- startBotGame ---

  it('startBotGame cancela el timeout, activa botSession y navega a /game', async () => {
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance as LobbyPage & { startBotGame: (d: string) => void };
    component.startBotGame('easy' as never);
    expect(matchmakingTimeout.cancel).toHaveBeenCalled();
    expect(botSession.startBotSession).toHaveBeenCalledWith('easy');
    expect(router.navigate).toHaveBeenCalledWith(['/game']);
  });

  it('startBotGame llama hub.leaveRoom si estaba buscando rival', async () => {
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance;
    component.searching.set(true);
    component.startBotGame('medium' as never);
    expect(hub.leaveRoom).toHaveBeenCalled();
    expect(component.searching()).toBe(false);
  });

  // --- Template: oferta de bot tras timeout ---

  it('muestra la oferta de bot cuando matchmakingTimeout.expired() es true', () => {
    matchmakingTimeout.expired.set(true);
    fixture.detectChanges();
    const oferta = fixture.nativeElement.querySelector('[data-timeout-offer]');
    expect(oferta).not.toBeNull();
  });

  it('no muestra la oferta de bot cuando expired() es false', () => {
    matchmakingTimeout.expired.set(false);
    fixture.detectChanges();
    const oferta = fixture.nativeElement.querySelector('[data-timeout-offer]');
    expect(oferta).toBeNull();
  });

  // --- Template: picker permanente de bot ---

  it('el picker permanente de bot es visible en estado inicial del lobby', () => {
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Jugar contra bot');
  });

  it('el picker de bot está en el DOM en estado inicial', () => {
    const picker = fixture.nativeElement.querySelector('[data-bot-picker]');
    expect(picker).not.toBeNull();
  });

  // --- Header auth button ---

  it('renders auth button in header', () => {
    expect(fixture.nativeElement.querySelector('[data-auth-btn]')).not.toBeNull();
  });

  it('auth modal is hidden by default', () => {
    expect(fixture.nativeElement.querySelector('[data-auth-modal]')).toBeNull();
  });

  it('clicking auth button shows auth modal', () => {
    fixture.nativeElement.querySelector('[data-auth-btn]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-auth-modal]')).not.toBeNull();
  });

  it('clicking modal close button hides modal', () => {
    fixture.componentInstance.showAuthModal.set(true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-modal-close]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-auth-modal]')).toBeNull();
  });

  it('clicking backdrop hides modal', () => {
    fixture.componentInstance.showAuthModal.set(true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-auth-modal]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-auth-modal]')).toBeNull();
  });

  it('shows login form by default when modal is open', () => {
    fixture.componentInstance.showAuthModal.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-login-form]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-register-form]')).toBeNull();
  });

  it('clicking register tab shows register form', () => {
    fixture.componentInstance.showAuthModal.set(true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-tab-register]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-register-form]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-login-form]')).toBeNull();
  });

  it('onLogin cierra el modal cuando auth.login tiene éxito', () => {
    fixture.componentInstance.showAuthModal.set(true);
    fixture.detectChanges();
    fixture.componentInstance.authUsername.set('alice');
    fixture.componentInstance.authPassword.set('pass');
    fixture.nativeElement.querySelector('[data-login-btn]').click();
    fixture.detectChanges();
    expect(auth.login).toHaveBeenCalledWith('alice', 'pass');
    expect(fixture.nativeElement.querySelector('[data-auth-modal]')).toBeNull();
  });

  it('onLogin muestra error cuando auth.login falla', () => {
    auth.login.mockReturnValue(throwError(() => new Error('unauthorized')));
    fixture.componentInstance.showAuthModal.set(true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-login-btn]').click();
    fixture.detectChanges();
    const err = fixture.nativeElement.querySelector('[data-auth-error]');
    expect(err).not.toBeNull();
    expect(err.textContent).toContain('Credenciales incorrectas');
  });

  it('onRegister cierra el modal cuando auth.register tiene éxito', () => {
    fixture.componentInstance.showAuthModal.set(true);
    fixture.componentInstance.authTab.set('register');
    fixture.detectChanges();
    fixture.componentInstance.authUsername.set('newuser');
    fixture.componentInstance.authPassword.set('pass');
    fixture.nativeElement.querySelector('[data-register-btn]').click();
    fixture.detectChanges();
    expect(auth.register).toHaveBeenCalledWith('newuser', 'pass');
    expect(fixture.nativeElement.querySelector('[data-auth-modal]')).toBeNull();
  });

  it('muestra botón de cerrar sesión cuando el usuario está autenticado', () => {
    (auth.currentUser as ReturnType<typeof signal<any>>).set({ kind: 'authenticated', user: { id: 'u1', username: 'alice', token: 'jwt' } });
    fixture.componentInstance.showAuthModal.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-logout-btn]')).not.toBeNull();
  });

  it('onLogout llama auth.logout y cierra el modal', () => {
    (auth.currentUser as ReturnType<typeof signal<any>>).set({ kind: 'authenticated', user: { id: 'u1', username: 'alice', token: 'jwt' } });
    fixture.componentInstance.showAuthModal.set(true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-logout-btn]').click();
    fixture.detectChanges();
    expect(auth.logout).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-auth-modal]')).toBeNull();
  });
});
