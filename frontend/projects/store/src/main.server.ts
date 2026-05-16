import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

export { ɵgetOrCreateAngularServerApp } from '@angular/ssr';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bootstrap = (context?: any) => bootstrapApplication(App, config, context);
export default bootstrap;
