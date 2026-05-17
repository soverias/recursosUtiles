import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';

export interface PushSubscriptionDto {
  endpoint: string;
  p256dh: string;
  auth: string;
}

@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly swPush = inject(SwPush);

  /** True if the browser supports Push API and we're in a secure context. */
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'PushManager' in window
        && 'Notification' in window
        && this.swPush.isEnabled;
  }

  /** True if the user has already granted notification permission. */
  hasPermission(): boolean {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  }

  /**
   * Subscribes the browser to push notifications using the given VAPID public key.
   * Pops the permission prompt if needed. Returns the subscription credentials
   * ready to POST to the server.
   */
  async subscribe(vapidPublicKey: string): Promise<PushSubscriptionDto> {
    const sub = await this.swPush.requestSubscription({ serverPublicKey: vapidPublicKey });
    return this.toDto(sub);
  }

  /** Returns the current subscription if any (null otherwise). */
  async current(): Promise<PushSubscriptionDto | null> {
    const sub = await this.swPush.subscription
      .toPromise()
      .catch(() => null);
    return sub ? this.toDto(sub) : null;
  }

  private toDto(sub: PushSubscription): PushSubscriptionDto {
    const json = sub.toJSON();
    const keys = (json.keys ?? {}) as Record<string, string>;
    return {
      endpoint: json.endpoint!,
      p256dh: keys['p256dh'] ?? '',
      auth: keys['auth'] ?? '',
    };
  }
}
