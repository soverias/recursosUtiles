import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastOutletComponent } from '@shared/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastOutletComponent],
  template: `
    <router-outlet />
    <app-toast-outlet />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
