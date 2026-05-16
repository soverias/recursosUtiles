import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameHubService } from '../../core/services/game-hub.service';
import { GameStateService } from '../game/game-state.service';
import { AuthService } from '../../core/services/auth.service';
import { RoomInfo } from '../../core/models/room.model';
import { BotSessionService } from '../../core/services/bot-session.service';
import { MatchmakingTimeoutService } from '../../core/services/matchmaking-timeout.service';
import { BotDifficulty } from '../../core/models/bot.model';
import { BotDifficultyPickerComponent } from './components/bot-difficulty-picker/bot-difficulty-picker.component';

type AuthTab = 'login' | 'register';

@Component({
  selector: 'app-lobby-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BotDifficultyPickerComponent],
  template: `
    <!-- Header -->
    <header class="fixed top-0 inset-x-0 flex items-center justify-between px-4 h-14 bg-gray-950 border-b border-gray-800 z-10">
      <span class="w-10"></span>
      <span class="text-xl font-black text-white tracking-tight">BANG!</span>
      <button data-auth-btn (click)="toggleAuthModal()"
        class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 cursor-pointer hover:bg-gray-700 transition-colors">
        @if (isAuthenticated()) {
          <span class="text-yellow-400 font-bold text-sm">{{ userInitial() }}</span>
        } @else {
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        }
      </button>
    </header>

    <!-- Main content -->
    <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4 pt-20">
      <div class="w-full max-w-sm space-y-6">

        <!-- Random matchmaking -->
        <div class="bg-gray-800 rounded-2xl p-5 space-y-3">
          <h2 class="text-white font-bold">Partida aleatoria</h2>
          <p class="text-gray-400 text-sm">Te emparejamos con un jugador disponible.</p>
          @if (searching()) {
            <p class="text-yellow-400 text-sm text-center animate-pulse">Buscando rival…</p>
          }
          <button data-join-random (click)="joinRandom()"
            [disabled]="searching()"
            class="w-full py-3 rounded-xl bg-yellow-400 text-gray-900 font-bold cursor-pointer disabled:opacity-50 hover:bg-yellow-300 active:scale-95 transition-all">
            Jugar ahora
          </button>
          @if (matchmakingTimeout.expired()) {
            <div data-timeout-offer class="text-center space-y-2">
              <p class="text-gray-400 text-sm">No hemos encontrado rival. ¿Quieres jugar contra un bot?</p>
              <app-bot-difficulty-picker (selected)="startBotGame($event)" />
            </div>
          }
        </div>

        <!-- Jugar contra bot -->
        <div class="bg-gray-800 rounded-2xl p-5 space-y-3">
          <h2 class="text-white font-bold">Jugar contra bot</h2>
          <p class="text-gray-400 text-sm">Practica contra la máquina.</p>
          <app-bot-difficulty-picker data-bot-picker (selected)="startBotGame($event)" />
        </div>

        <!-- Private room -->
        <div class="bg-gray-800 rounded-2xl p-5 space-y-3">
          <h2 class="text-white font-bold">Sala privada</h2>

          @if (gameState.room()?.code) {
            <p class="text-gray-400 text-sm">Comparte este código con tu amigo:</p>
            <p data-room-code class="text-center text-3xl font-black text-yellow-400 tracking-widest">
              {{ gameState.room()!.code }}
            </p>
          } @else {
            <button data-create-private (click)="createPrivate()"
              class="w-full py-3 rounded-xl border border-gray-600 text-gray-300 font-semibold cursor-pointer hover:border-gray-400 active:scale-95 transition-all">
              Crear sala privada
            </button>
          }

          <div class="flex gap-2">
            <input data-code-input type="text" placeholder="Código de sala"
              maxlength="6"
              [value]="roomCode()" (input)="roomCode.set($any($event.target).value.toUpperCase())"
              class="flex-1 px-4 py-2 rounded-xl bg-gray-700 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-400 uppercase tracking-widest" />
            <button data-join-private (click)="joinPrivate()"
              class="px-4 py-2 rounded-xl bg-gray-600 text-white font-semibold cursor-pointer hover:bg-gray-500 active:scale-95 transition-all">
              Unirse
            </button>
          </div>

          @if (error()) {
            <p data-error class="text-red-400 text-sm text-center">{{ error() }}</p>
          }
        </div>
      </div>
    </div>

    <!-- Auth Modal -->
    @if (showAuthModal()) {
      <div data-auth-modal
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        (click)="closeAuthModal()">
        <div class="w-full max-w-sm bg-gray-900 rounded-2xl p-6 space-y-4" (click)="$event.stopPropagation()">

          @if (isAuthenticated()) {
            <div class="text-center space-y-4">
              <div class="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center mx-auto">
                <span class="text-gray-900 font-bold text-2xl">{{ userInitial() }}</span>
              </div>
              <p class="text-white font-semibold">{{ playerName() }}</p>
              <button data-logout-btn (click)="onLogout()"
                class="w-full py-3 rounded-xl border border-gray-600 text-gray-300 font-semibold cursor-pointer hover:border-gray-400 active:scale-95 transition-all">
                Cerrar sesión
              </button>
            </div>

          } @else {
            <div class="flex justify-between items-center">
              <h2 class="text-white font-bold text-lg">Cuenta</h2>
              <button data-modal-close (click)="closeAuthModal()" class="text-gray-400 cursor-pointer hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>

            <div class="flex bg-gray-800 rounded-xl p-1">
              <button data-tab-login (click)="authTab.set('login')"
                class="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                [class]="authTab() === 'login' ? 'bg-white text-gray-900' : 'text-gray-400'">
                Iniciar sesión
              </button>
              <button data-tab-register (click)="authTab.set('register')"
                class="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                [class]="authTab() === 'register' ? 'bg-white text-gray-900' : 'text-gray-400'">
                Registrarse
              </button>
            </div>

            @if (authTab() === 'login') {
              <div data-login-form class="space-y-3">
                <input data-auth-username type="text" placeholder="Username"
                  [value]="authUsername()" (input)="authUsername.set($any($event.target).value)"
                  class="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-400" />
                <input data-auth-password type="password" placeholder="Contraseña"
                  [value]="authPassword()" (input)="authPassword.set($any($event.target).value)"
                  class="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-400" />
                @if (authError()) {
                  <p data-auth-error class="text-red-400 text-sm text-center">{{ authError() }}</p>
                }
                <button data-login-btn (click)="onLogin()"
                  class="w-full py-3 rounded-xl bg-yellow-400 text-gray-900 font-bold cursor-pointer hover:bg-yellow-300 active:scale-95 transition-all">
                  Iniciar sesión
                </button>
              </div>
            }

            @if (authTab() === 'register') {
              <div data-register-form class="space-y-3">
                <input data-auth-username type="text" placeholder="Username"
                  [value]="authUsername()" (input)="authUsername.set($any($event.target).value)"
                  class="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-400" />
                <input data-auth-password type="password" placeholder="Contraseña"
                  [value]="authPassword()" (input)="authPassword.set($any($event.target).value)"
                  class="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-400" />
                @if (authError()) {
                  <p data-auth-error class="text-red-400 text-sm text-center">{{ authError() }}</p>
                }
                <button data-register-btn (click)="onRegister()"
                  class="w-full py-3 rounded-xl bg-yellow-400 text-gray-900 font-bold cursor-pointer hover:bg-yellow-300 active:scale-95 transition-all">
                  Registrarse
                </button>
              </div>
            }
          }
        </div>
      </div>
    }
  `,
})
export class LobbyPage implements OnInit, OnDestroy {
  protected readonly hub = inject(GameHubService);
  protected readonly gameState = inject(GameStateService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly botSession = inject(BotSessionService);
  protected readonly matchmakingTimeout = inject(MatchmakingTimeoutService);

  readonly searching = signal(false);
  readonly roomCode = signal('');
  readonly error = signal('');

  readonly showAuthModal = signal(false);
  readonly authTab = signal<AuthTab>('login');
  readonly authUsername = signal('');
  readonly authPassword = signal('');
  readonly authError = signal('');

  readonly isAuthenticated = computed(() => this.auth.currentUser().kind === 'authenticated');
  readonly playerName = computed(() => {
    const state = this.auth.currentUser();
    return state.kind !== 'anonymous' ? state.user.username : '';
  });
  readonly userInitial = computed(() => this.playerName().charAt(0).toUpperCase());

  async ngOnInit(): Promise<void> {
    this.botSession.endBotSession();
    await this.hub.connect();
    this.hub.on<RoomInfo>('OpponentJoined', (room) => {
      this.matchmakingTimeout.cancel();
      this.gameState.opponentJoined(room);
      this.router.navigate(['/game']);
    });
  }

  async ngOnDestroy(): Promise<void> {
    // hub stays alive during game; disconnect happens on game end
  }

  async joinRandom(): Promise<void> {
    this.searching.set(true);
    this.matchmakingTimeout.start(30_000);
    await this.hub.joinRandom();
  }

  async createPrivate(): Promise<void> {
    this.hub.on<RoomInfo>('RoomCreated', (room) => {
      this.gameState.opponentJoined(room);
    });
    await this.hub.createPrivateRoom();
  }

  async joinPrivate(): Promise<void> {
    this.error.set('');
    try {
      await this.hub.joinPrivate(this.roomCode());
    } catch {
      this.error.set('Sala no encontrada');
    }
  }

  startBotGame(difficulty: BotDifficulty): void {
    this.matchmakingTimeout.cancel();
    if (this.searching()) {
      this.hub.leaveRoom();
      this.searching.set(false);
    }
    this.botSession.startBotSession(difficulty);
    this.router.navigate(['/game']);
  }

  toggleAuthModal(): void {
    this.showAuthModal.update(v => !v);
    this.authError.set('');
  }

  closeAuthModal(): void {
    this.showAuthModal.set(false);
    this.authError.set('');
  }

  onLogin(): void {
    this.authError.set('');
    this.auth.login(this.authUsername(), this.authPassword()).subscribe({
      next: () => this.closeAuthModal(),
      error: () => this.authError.set('Credenciales incorrectas'),
    });
  }

  onRegister(): void {
    this.authError.set('');
    this.auth.register(this.authUsername(), this.authPassword()).subscribe({
      next: () => this.closeAuthModal(),
      error: (err) => {
        this.authError.set(err?.status === 409 ? 'Username no disponible' : 'Error al registrarse');
      },
    });
  }

  onLogout(): void {
    this.auth.logout();
    this.closeAuthModal();
  }
}
