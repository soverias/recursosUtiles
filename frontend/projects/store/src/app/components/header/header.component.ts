import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { PwaInstallService } from '../../services/pwa-install.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly pwaInstall = inject(PwaInstallService);

  readonly canInstall = this.pwaInstall.canInstall;

  install(): void {
    this.pwaInstall.promptInstall();
  }
}
