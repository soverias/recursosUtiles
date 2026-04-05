import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Tool } from '../../models/tool.model';

@Component({
  selector: 'app-card',
  templateUrl: './app-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--card-color]': 'tool().color',
  },
})
export class AppCardComponent {
  readonly tool = input.required<Tool>();
}
