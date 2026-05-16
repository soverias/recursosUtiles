import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

const STYLES: Record<string, string> = {
  info:    'bg-gray-700 text-white',
  success: 'bg-green-600 text-white',
  error:   'bg-red-600 text-white',
  warning: 'bg-yellow-500 text-gray-900',
};

@Component({
  selector: 'app-toast-outlet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="px-5 py-3 rounded-xl shadow-lg text-sm font-semibold max-w-xs text-center pointer-events-auto transition-all"
          [class]="typeClass(toast.type)"
          (click)="toastService.dismiss(toast.id)"
        >
          {{ toast.message }}
        </div>
      }
    </div>
  `,
})
export class ToastOutletComponent {
  protected readonly toastService = inject(ToastService);

  protected typeClass(type: string): string {
    return STYLES[type] ?? STYLES['info'];
  }
}
