import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Exclusion, Participant } from '../../models';

@Component({
  selector: 'app-exclusion-list',
  templateUrl: './exclusion-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExclusionListComponent {
  readonly participants = input.required<Participant[]>();
  readonly exclusions = input.required<Exclusion[]>();
  readonly addExclusion = output<{ idA: string; idB: string }>();
  readonly removeExclusion = output<{ idA: string; idB: string }>();

  protected readonly selectedA = signal<string>('');
  protected readonly selectedB = signal<string>('');
  protected readonly canAdd = computed(
    () => !!this.selectedA() && !!this.selectedB() && this.selectedA() !== this.selectedB()
  );

  protected participantName(id: string): string {
    return this.participants().find(p => p.id === id)?.name ?? id;
  }

  protected onAdd(): void {
    if (!this.canAdd()) return;
    this.addExclusion.emit({ idA: this.selectedA(), idB: this.selectedB() });
    this.selectedA.set('');
    this.selectedB.set('');
  }

  protected onRemove(idA: string, idB: string): void {
    this.removeExclusion.emit({ idA, idB });
  }
}
