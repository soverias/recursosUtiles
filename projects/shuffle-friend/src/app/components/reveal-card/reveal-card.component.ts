import { ChangeDetectionStrategy, Component, input, OnInit, output, signal } from '@angular/core';

@Component({
  selector: 'app-reveal-card',
  templateUrl: './reveal-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevealCardComponent implements OnInit {
  readonly giverName = input.required<string>();
  readonly receiverName = input.required<string>();
  readonly isRevealed = input<boolean>(false);
  readonly dismiss = output<void>();

  protected readonly showing = signal(false);

  ngOnInit(): void {
    this.showing.set(this.isRevealed());
  }

  protected reveal(): void {
    this.showing.set(true);
    this.dismiss.emit();
  }
}
