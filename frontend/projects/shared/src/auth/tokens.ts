import { InjectionToken } from '@angular/core';

/**
 * Base URL for the auth API (e.g. "http://localhost:5014/api" or "/api").
 * Each consumer app must provide it in its app config:
 *   { provide: AUTH_API_BASE, useValue: environment.apiBase }
 */
export const AUTH_API_BASE = new InjectionToken<string>('AUTH_API_BASE');
