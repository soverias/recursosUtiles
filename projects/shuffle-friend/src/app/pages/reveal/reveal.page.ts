import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { RevealCardComponent } from '../../components/reveal-card/reveal-card.component';
import { CountdownTimerComponent } from '../../components/countdown-timer/countdown-timer.component';
import { Participant } from '../../models';

@Component({
  selector: 'app-reveal-page',
  imports: [ConfirmDialogComponent, RevealCardComponent, CountdownTimerComponent],
  templateUrl: './reveal.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevealPage {
  protected readonly game = inject(GameService);
  private readonly router = inject(Router);

  protected readonly confirmOpen = signal(false);
  protected readonly revealing = signal(false);
  protected readonly selectedParticipant = signal<Participant | null>(null);

  protected readonly receiverName = computed(() => {
    const sel = this.selectedParticipant();
    if (!sel) return '';
    const assignment = this.game.assignments().find(a => a.giverId === sel.id);
    const receiver = this.game.participants().find(p => p.id === assignment?.receiverId);
    return receiver?.name ?? '';
  });

  protected selectParticipant(p: Participant): void {
    this.selectedParticipant.set(p);
    this.confirmOpen.set(true);
  }

  protected confirmReveal(): void {
    this.confirmOpen.set(false);
    this.revealing.set(true);
  }

  protected cancelConfirm(): void {
    this.confirmOpen.set(false);
    this.selectedParticipant.set(null);
  }

  protected onDismiss(): void {
    const sel = this.selectedParticipant();
    if (sel) this.game.revealFor(sel.id);
    this.revealing.set(false);
    this.selectedParticipant.set(null);
  }

  protected resetGame(): void {
    this.game.reset();
    this.router.navigate(['/setup']);
  }
}
