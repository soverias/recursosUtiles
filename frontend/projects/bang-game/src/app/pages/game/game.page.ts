import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from './game-state.service';
import { GameHubService } from '../../core/services/game-hub.service';
import { ToastService } from '@shared/ui';
import { BangButtonComponent } from './components/bang-button/bang-button.component';
import { ResultComponent } from './components/result/result.component';
import { RoundResult } from '../../core/models/room.model';
import { BotSessionService } from '../../core/services/bot-session.service';
import { BotGameService } from '../../core/services/bot-game.service';

@Component({
  selector: 'app-game-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BangButtonComponent, ResultComponent],
  template: `
    <div class="min-h-screen bg-gray-950 flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 bg-gray-900">
        <span class="text-gray-400 text-sm">vs <span class="text-white font-bold">{{ gameState.room()?.opponentUsername }}</span></span>
        <span class="text-yellow-400 font-black tracking-widest">BANG!</span>
      </div>

      <!-- Content by phase -->
      <div class="flex-1 flex flex-col">

        @switch (gameState.phase()) {

          @case ('waiting-opponent') {
            <div class="flex-1 flex items-center justify-center">
              <div class="text-center space-y-6 p-6">
                <p class="text-white text-xl">Sala lista</p>
                <p class="text-gray-400">Cuando los dos estéis listos, comenzará la cuenta atrás.</p>
                @if (gameState.opponentIsReady()) {
                  <p data-opponent-ready class="text-green-400 font-semibold">
                    ✓ {{ gameState.room()?.opponentUsername }} está listo
                  </p>
                }
                <button data-ready-btn (click)="onReady()"
                  class="px-10 py-4 rounded-2xl bg-yellow-400 text-gray-900 text-xl font-black cursor-pointer hover:bg-yellow-300 active:scale-95 transition-all">
                  ¡Listo!
                </button>
              </div>
            </div>
          }

          @case ('both-ready') {
            <div class="flex-1 flex items-center justify-center">
              <p class="text-white text-2xl font-bold animate-pulse">Preparando...</p>
            </div>
          }

          @case ('countdown') {
            <app-bang-button
              class="flex-1"
              [active]="false"
              [label]="gameState.countdownLabel()"
              [tapConsumed]="gameState.tapConsumed()"
              (tapped)="onTap()"
            />
          }

          @case ('waiting-bang') {
            <app-bang-button
              class="flex-1"
              [active]="false"
              [tapConsumed]="gameState.tapConsumed()"
              (tapped)="onTap()"
            />
          }

          @case ('bang-active') {
            <app-bang-button
              class="flex-1"
              [active]="true"
              [tapConsumed]="gameState.tapConsumed()"
              (tapped)="onTap()"
            />
          }

          @case ('result') {
            <app-result
              class="flex-1"
              [result]="gameState.lastResult()!"
              [opponentUsername]="gameState.room()?.opponentUsername ?? ''"
              [opponentWantsRepeat]="gameState.opponentWantsRepeat()"
              (repeat)="onRepeat()"
              (playOther)="onPlayOther()"
            />
          }

          @case ('waiting-rematch') {
            <div class="flex-1 flex items-center justify-center">
              <p class="text-gray-400 text-xl animate-pulse">Esperando al oponente…</p>
            </div>
          }

        }
      </div>
    </div>
  `,
})
export class GamePage implements OnInit, OnDestroy {
  protected readonly gameState = inject(GameStateService);
  private readonly hub = inject(GameHubService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly botSession = inject(BotSessionService);
  private readonly botGame = inject(BotGameService);

  ngOnInit(): void {
    if (this.botSession.isBotGame()) {
      this.botGame.startGame();
      return;
    }

    this.hub.on<void>('BothReady', () => this.gameState.bothReady());
    this.hub.on<void>('CountdownStart', () => this.gameState.countdownStart());
    this.hub.on<void>('WaitingBang', () => this.gameState.waitingBang());
    this.hub.on<void>('Bang', () => this.gameState.bang());
    this.hub.on<RoundResult>('RoundResult', (result) => this.gameState.roundResult(result));
    this.hub.on<void>('OpponentReady', () => this.gameState.opponentReady());
    this.hub.on<void>('OpponentWantsRematch', () => this.gameState.opponentWantsRematch());
    this.hub.on<void>('OpponentLeft', () => {
      this.toast.show('Tu oponente ha abandonado la partida. Volviendo al lobby en 5 segundos…', 'warning');
      setTimeout(() => {
        this.gameState.reset();
        this.router.navigate(['/lobby']);
      }, 5000);
    });
  }

  ngOnDestroy(): void {
    if (this.botSession.isBotGame()) {
      this.botGame.reset();
      this.botSession.endBotSession();
    }
  }

  async onReady(): Promise<void> {
    if (this.botSession.isBotGame()) {
      this.botGame.playerReady();
    } else {
      await this.hub.sendReady();
    }
  }

  async onTap(): Promise<void> {
    if (this.botSession.isBotGame()) {
      this.botGame.playerTapped();
    } else {
      this.gameState.consumeTap();
      await this.hub.sendTap();
    }
  }

  async onRepeat(): Promise<void> {
    if (this.botSession.isBotGame()) {
      this.gameState.waitingRematch();
      this.botGame.rematch();
    } else {
      this.gameState.waitingRematch();
      await this.hub.repeat();
    }
  }

  async onPlayOther(): Promise<void> {
    if (this.botSession.isBotGame()) {
      this.botGame.abandon();
      await this.router.navigate(['/lobby']);
    } else {
      this.gameState.reset();
      await this.hub.leaveRoom();
      await this.router.navigate(['/lobby']);
    }
  }
}
