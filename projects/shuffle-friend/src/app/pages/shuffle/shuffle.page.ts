import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-shuffle-page',
  templateUrl: './shuffle.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShufflePage {
  protected readonly game = inject(GameService);
  private readonly router = inject(Router);
  protected readonly error = signal(false);

  protected doShuffle(): void {
    const result = this.game.shuffle();
    if (result === 'ok') {
      this.router.navigate(['/reveal']);
    } else {
      this.error.set(true);
    }
  }

  protected goBack(): void {
    this.router.navigate(['/setup']);
  }
}
