import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameHubService } from '../../core/services/game-hub.service';
import { GameStateService } from '../game/game-state.service';
import { AuthService } from '../../core/services/auth.service';
import { RoomInfo } from '../../core/models/room.model';

@Component({
  selector: 'app-lobby-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div class="w-full max-w-sm space-y-6">
        <div class="text-center">
          <h1 class="text-4xl font-black text-white tracking-tight">BANG!</h1>
          <p class="text-gray-400 mt-1">Hola, <span class="text-yellow-400">{{ playerName() }}</span></p>
        </div>

        <!-- Random matchmaking -->
        <div class="bg-gray-800 rounded-2xl p-5 space-y-3">
          <h2 class="text-white font-bold">Partida aleatoria</h2>
          <p class="text-gray-400 text-sm">Te emparejamos con un jugador disponible.</p>
          @if (searching()) {
            <p class="text-yellow-400 text-sm text-center animate-pulse">Buscando rival…</p>
          }
          <button data-join-random (click)="joinRandom()"
            [disabled]="searching()"
            class="w-full py-3 rounded-xl bg-yellow-400 text-gray-900 font-bold disabled:opacity-50 hover:bg-yellow-300 active:scale-95 transition-all">
            Jugar ahora
          </button>
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
              class="w-full py-3 rounded-xl border border-gray-600 text-gray-300 font-semibold hover:border-gray-400 active:scale-95 transition-all">
              Crear sala privada
            </button>
          }

          <div class="flex gap-2">
            <input data-code-input type="text" placeholder="Código de sala"
              maxlength="6"
              [value]="roomCode()" (input)="roomCode.set($any($event.target).value.toUpperCase())"
              class="flex-1 px-4 py-2 rounded-xl bg-gray-700 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-400 uppercase tracking-widest" />
            <button data-join-private (click)="joinPrivate()"
              class="px-4 py-2 rounded-xl bg-gray-600 text-white font-semibold hover:bg-gray-500 active:scale-95 transition-all">
              Unirse
            </button>
          </div>

          @if (error()) {
            <p data-error class="text-red-400 text-sm text-center">{{ error() }}</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class LobbyPage implements OnInit, OnDestroy {
  protected readonly hub = inject(GameHubService);
  protected readonly gameState = inject(GameStateService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly searching = signal(false);
  readonly roomCode = signal('');
  readonly error = signal('');

  readonly playerName = () => {
    const state = this.auth.currentUser();
    return state.kind !== 'anonymous' ? state.user.username : '';
  };

  async ngOnInit(): Promise<void> {
    await this.hub.connect();
    this.hub.on<RoomInfo>('OpponentJoined', (room) => {
      this.gameState.opponentJoined(room);
      this.router.navigate(['/game']);
    });
  }

  async ngOnDestroy(): Promise<void> {
    // hub stays alive during game; disconnect happens on game end
  }

  async joinRandom(): Promise<void> {
    this.searching.set(true);
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
}
