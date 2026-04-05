import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../../core/config/api.config';

interface RankingEntry {
  id: string;
  username: string;
  wins: number;
  avgReactionMs: number;
  winRatio: number;
}

type SortKey = 'wins' | 'avgReactionMs' | 'winRatio';

@Component({
  selector: 'app-ranking-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-950 p-4">
      <h1 class="text-3xl font-black text-white text-center mb-6">Ranking</h1>

      <div class="max-w-lg mx-auto overflow-hidden rounded-2xl bg-gray-900">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-gray-400 border-b border-gray-800">
              <th class="py-3 px-4 text-left">#</th>
              <th class="py-3 px-4 text-left">Jugador</th>
              <th data-sort-wins (click)="setSort('wins')"
                class="py-3 px-4 text-right cursor-pointer hover:text-yellow-400 transition-colors"
                [class.text-yellow-400]="sortKey() === 'wins'">
                Victorias
              </th>
              <th data-sort-reaction (click)="setSort('avgReactionMs')"
                class="py-3 px-4 text-right cursor-pointer hover:text-yellow-400 transition-colors"
                [class.text-yellow-400]="sortKey() === 'avgReactionMs'">
                T. Medio (ms)
              </th>
              <th data-sort-ratio (click)="setSort('winRatio')"
                class="py-3 px-4 text-right cursor-pointer hover:text-yellow-400 transition-colors"
                [class.text-yellow-400]="sortKey() === 'winRatio'">
                Ratio
              </th>
            </tr>
          </thead>
          <tbody>
            @for (p of sorted(); track p.id; let i = $index) {
              <tr data-player-row class="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                <td class="py-3 px-4 text-gray-500">{{ i + 1 }}</td>
                <td class="py-3 px-4 text-white font-semibold">{{ p.username }}</td>
                <td class="py-3 px-4 text-right text-yellow-400 font-bold">{{ p.wins }}</td>
                <td class="py-3 px-4 text-right text-gray-300">{{ p.avgReactionMs }}</td>
                <td class="py-3 px-4 text-right text-gray-300">{{ (p.winRatio * 100).toFixed(0) }}%</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class RankingPage {
  private readonly http = inject(HttpClient);

  readonly players = signal<RankingEntry[]>([]);
  readonly sortKey = signal<SortKey>('wins');

  readonly sorted = computed(() => {
    const key = this.sortKey();
    const dir = key === 'avgReactionMs' ? 1 : -1;
    return [...this.players()].sort((a, b) => (a[key] - b[key]) * dir);
  });

  constructor() {
    this.http.get<RankingEntry[]>(`${API_BASE}/ranking`).subscribe(data => this.players.set(data));
  }

  setSort(key: SortKey): void {
    this.sortKey.set(key);
  }
}
