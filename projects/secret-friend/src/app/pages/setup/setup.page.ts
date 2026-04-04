import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { ParticipantListComponent } from '../../components/participant-list/participant-list.component';
import { ExclusionListComponent } from '../../components/exclusion-list/exclusion-list.component';

@Component({
  selector: 'app-setup-page',
  imports: [ParticipantListComponent, ExclusionListComponent],
  templateUrl: './setup.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupPage {
  protected readonly game = inject(GameService);
  private readonly router = inject(Router);

  protected goToShuffle(): void {
    this.router.navigate(['/shuffle']);
  }

  protected onAddParticipant(name: string): void {
    this.game.addParticipant(name);
  }

  protected onRemoveParticipant(id: string): void {
    this.game.removeParticipant(id);
  }

  protected onAddExclusion(e: { idA: string; idB: string }): void {
    this.game.addExclusion(e.idA, e.idB);
  }

  protected onRemoveExclusion(e: { idA: string; idB: string }): void {
    this.game.removeExclusion(e.idA, e.idB);
  }
}
