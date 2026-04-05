import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from './game-state.service';
import { GameHubService } from '../../core/services/game-hub.service';
import { AuthService } from '../../core/services/auth.service';
import { BangButtonComponent } from './components/bang-button/bang-button.component';
import { CountdownComponent } from './components/countdown/countdown.component';
import { ResultComponent } from './components/result/result.component';
import { RoundResult } from '../../core/models/room.model';

@Component({
  selector: 'app-game-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BangButtonComponent, CountdownComponent, ResultComponent],
  template: `
    <div class="min-h-screen bg-gray-950 flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 bg-gray-900">
        <span class="text-gray-400 text-sm">vs <span class="text-white font-bold">{{ gameState.room()?.opponentUsername }}</span></span>
        <span class="text-yellow-400 font-black tracking-widest">BANG!</span>
      </div>

      <!-- Content by phase -->
      <div class="flex-1 flex items-center justify-center">

        @switch (gameState.phase()) {

          @case ('waiting-opponent') {
            <div class="text-center space-y-6 p-6">
              <p class="text-white text-xl">Sala lista</p>
              <p class="text-gray-400">Cuando los dos estéis listos, comenzará la cuenta atrás.</p>
              <button data-ready-btn (click)="onReady()"
                class="px-10 py-4 rounded-2xl bg-yellow-400 text-gray-900 text-xl font-black hover:bg-yellow-300 active:scale-95 transition-all">
                ¡Listo!
              </button>
            </div>
          }

          @case ('both-ready') {
            <p class="text-white text-2xl font-bold animate-pulse">Preparando...</p>
          }

          @case ('countdown') {
            <app-countdown [seconds]="3" />
          }

          @case ('waiting-bang') {
            <p class="text-gray-500 text-4xl font-black animate-pulse">...</p>
          }

          @case ('bang-active') {
            <app-bang-button
              class="w-full h-full"
              [active]="true"
              [tapConsumed]="gameState.tapConsumed()"
              (tapped)="onTap()"
            />
          }

          @case ('result') {
            <app-result
              class="w-full h-full"
              [result]="gameState.lastResult()!"
              [myId]="myId()"
              (repeat)="onRepeat()"
              (playOther)="onPlayOther()"
            />
          }

        }
      </div>
    </div>
  `,
})
export class GamePage implements OnInit {
  protected readonly gameState = inject(GameStateService);
  private readonly hub = inject(GameHubService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly myId = computed(() => {
    const state = this.auth.currentUser();
    return state.kind !== 'anonymous' ? state.user.id : '';
  });

  ngOnInit(): void {
    this.hub.on<void>('BothReady', () => this.gameState.bothReady());
    this.hub.on<void>('CountdownStart', () => this.gameState.countdownStart());
    this.hub.on<void>('WaitingBang', () => this.gameState.waitingBang());
    this.hub.on<void>('Bang', () => this.gameState.bang());
    this.hub.on<RoundResult>('RoundResult', (result) => this.gameState.roundResult(result));
  }

  async onReady(): Promise<void> {
    await this.hub.sendReady();
  }

  async onTap(): Promise<void> {
    this.gameState.consumeTap();
    await this.hub.sendTap();
  }

  async onRepeat(): Promise<void> {
    this.gameState.reset();
    await this.hub.repeat();
    await this.router.navigate(['/lobby']);
  }

  async onPlayOther(): Promise<void> {
    this.gameState.reset();
    await this.hub.leaveRoom();
    await this.router.navigate(['/lobby']);
  }
}
