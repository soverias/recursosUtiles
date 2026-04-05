import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RoundResult } from '../../../../core/models/room.model';

@Component({
  selector: 'app-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center h-full gap-6 p-6">
      @if (result().isFalseStart) {
        <div data-outcome class="text-center">
          <p class="text-5xl font-black text-red-500">Salida en falso</p>
          <p class="text-gray-400 mt-2">Pulsaste antes del BANG</p>
        </div>
      } @else if (isWinner()) {
        <div data-outcome class="text-center">
          <p class="text-6xl font-black text-yellow-400">¡GANASTE!</p>
          <p class="text-gray-300 mt-2">Tu tiempo: <span class="text-white font-bold">{{ result().winnerReactionMs }} ms</span></p>
        </div>
      } @else {
        <div data-outcome class="text-center">
          <p class="text-6xl font-black text-gray-400">PERDISTE</p>
          <p class="text-gray-300 mt-2">Tu tiempo: <span class="text-white font-bold">{{ result().loserReactionMs }} ms</span></p>
        </div>
      }

      <div class="w-full space-y-3 max-w-xs">
        <button data-repeat-btn (click)="repeat.emit()"
          class="w-full py-3 rounded-xl bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-300 active:scale-95 transition-all">
          Repetir
        </button>
        <button data-other-btn (click)="playOther.emit()"
          class="w-full py-3 rounded-xl border border-gray-600 text-gray-300 font-semibold hover:border-gray-400 active:scale-95 transition-all">
          Jugar con otro
        </button>
      </div>
    </div>
  `,
})
export class ResultComponent {
  readonly result = input.required<RoundResult>();
  readonly myId = input.required<string>();
  readonly repeat = output<void>();
  readonly playOther = output<void>();

  readonly isWinner = computed(() => this.result().winnerId === this.myId());
}
