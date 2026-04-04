import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Participant } from '../../models';

@Component({
  selector: 'app-participant-list',
  templateUrl: './participant-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantListComponent {
  readonly participants = input.required<Participant[]>();
  readonly remove = output<string>();
  readonly add = output<string>();

  protected readonly newName = signal('');

  protected onAdd(): void {
    const name = this.newName().trim();
    if (!name) return;
    this.add.emit(name);
    this.newName.set('');
  }

  protected onRemove(id: string): void {
    this.remove.emit(id);
  }
}
