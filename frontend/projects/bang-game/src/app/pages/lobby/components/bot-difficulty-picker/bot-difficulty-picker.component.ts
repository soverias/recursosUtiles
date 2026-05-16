import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { BOT_DIFFICULTY_CONFIGS, BotDifficulty } from '../../../../core/models/bot.model';

@Component({
  selector: 'app-bot-difficulty-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-2">
      @for (option of difficulties; track option.key) {
        <button
          [attr.data-difficulty]="option.key"
          (click)="selected.emit(option.key)"
          class="flex-1 py-2 rounded-xl border text-sm font-semibold transition-all
                 hover:bg-gray-700 active:scale-95 cursor-pointer
                 border-gray-600 text-gray-300">
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class BotDifficultyPickerComponent {
  readonly selected = output<BotDifficulty>();

  readonly difficulties: { key: BotDifficulty; label: string }[] = (
    Object.entries(BOT_DIFFICULTY_CONFIGS) as [BotDifficulty, typeof BOT_DIFFICULTY_CONFIGS[BotDifficulty]][]
  ).map(([key, cfg]) => ({ key, label: cfg.label }));
}
