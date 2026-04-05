import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-category-filter',
  templateUrl: './category-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFilterComponent {
  readonly categories = input.required<string[]>();
  readonly active = input<string | null>(null);
  readonly categorySelected = output<string | null>();

  select(category: string | null): void {
    this.categorySelected.emit(category);
  }
}
