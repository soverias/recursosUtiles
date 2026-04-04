import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { TOOLS } from '../../data/tools.data';
import { AppCardComponent } from '../app-card/app-card.component';
import { CategoryFilterComponent } from '../category-filter/category-filter.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppCardComponent, CategoryFilterComponent],
})
export class HomeComponent {
  readonly activeCategory = signal<string | null>(null);
  readonly categories = computed(() => [...new Set(TOOLS.map(t => t.category))]);
  readonly filteredTools = computed(() =>
    this.activeCategory()
      ? TOOLS.filter(t => t.category === this.activeCategory())
      : TOOLS,
  );
}
