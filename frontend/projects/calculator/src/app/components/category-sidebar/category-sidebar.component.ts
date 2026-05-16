import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UnitCategory, UnitCategoryMeta } from '../../core/models/unit.model';

@Component({
  selector: 'app-category-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="calc-sidebar fixed inset-y-0 left-0 z-30 flex flex-col
             transition-all duration-300 overflow-hidden
             lg:relative lg:inset-y-auto lg:left-auto lg:z-auto lg:translate-x-0"
      [class.w-48]="!collapsed()"
      [class.w-14]="collapsed()"
      [class.-translate-x-full]="!mobileOpen()">

      <!-- Spacer móvil para no solapar el header -->
      <div class="h-14 shrink-0 lg:hidden"></div>

      <!-- Categorías -->
      <nav class="flex-1 overflow-y-auto py-2">
        @for (cat of categories(); track cat.category) {
          <button
            class="calc-sidebar-item"
            [class.active]="cat.category === activeCategory()"
            [attr.title]="collapsed() ? cat.label : null"
            (click)="onCategoryClick(cat.category)">

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-4 h-4 shrink-0">
              @switch (cat.category) {
                @case ('numeric') {
                  <path d="M9 4v16M15 4v16M4 9h16M4 15h16"/>
                }
                @case ('length') {
                  <path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4"/>
                }
                @case ('weight') {
                  <path d="M12 3v18M8 21h8M3 9h18M7 9l-1.5 6h5L9 9M17 9l-1.5 6h5L19 9"/>
                }
                @case ('volume') {
                  <path d="M12 2L7 11a5 5 0 0 0 10 0L12 2z"/>
                }
                @case ('temperature') {
                  <path d="M14 14.76V4a2 2 0 0 0-4 0v10.76a4 4 0 1 0 4 0z"/>
                }
                @case ('data') {
                  <ellipse cx="12" cy="5" rx="9" ry="3"/>
                  <path d="M21 5v4c0 1.66-4.03 3-9 3S3 10.66 3 9V5"/>
                  <path d="M21 13c0 1.66-4.03 3-9 3s-9-1.34-9-3"/>
                  <path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4"/>
                }
              }
            </svg>

            @if (!collapsed()) {
              <span class="calc-sidebar-label">{{ cat.label }}</span>
            }
          </button>
        }
      </nav>

      <!-- Botón colapsar (solo desktop) -->
      <button
        data-collapse-toggle
        class="calc-collapse-btn hidden lg:flex"
        [attr.title]="collapsed() ? 'Expandir menú' : 'Colapsar menú'"
        (click)="toggleCollapse.emit()">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4 transition-transform duration-300"
          [class.rotate-180]="collapsed()">
          <path d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
    </aside>
  `,
})
export class CategorySidebarComponent {
  readonly categories = input.required<readonly UnitCategoryMeta[]>();
  readonly activeCategory = input.required<UnitCategory>();
  readonly collapsed = input<boolean>(false);
  readonly mobileOpen = input<boolean>(false);

  readonly categoryChange = output<UnitCategory>();
  readonly toggleCollapse = output<void>();
  readonly close = output<void>();

  onCategoryClick(category: UnitCategory): void {
    this.categoryChange.emit(category);
    this.close.emit();
  }
}
