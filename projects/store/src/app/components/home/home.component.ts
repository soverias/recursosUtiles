import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TOOLS } from '../../data/tools.data';
import { AppCardComponent } from '../app-card/app-card.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppCardComponent],
})
export class HomeComponent {
  readonly tools = TOOLS;
}
