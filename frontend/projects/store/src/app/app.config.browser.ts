import { mergeApplicationConfig } from '@angular/core';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { withEventReplay, provideClientHydration } from '@angular/platform-browser';
import { appConfig } from './app.config';

export const browserConfig = mergeApplicationConfig(appConfig, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
  ],
});
