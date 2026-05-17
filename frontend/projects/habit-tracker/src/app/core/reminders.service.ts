import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from './config/api.config';
import { PushSubscriptionDto } from './push.service';

export interface ReminderResponse {
  habitId: string;
  localTime: string;     // "HH:mm"
  timezone: string;      // IANA
  createdAt: string;     // ISO 8601 UTC
}

export interface UpsertReminderRequest {
  habitId: string;
  localTime: string;
  timezone: string;
  pushSubscription: PushSubscriptionDto;
}

@Injectable({ providedIn: 'root' })
export class RemindersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/api/reminders`;

  async vapidPublicKey(): Promise<string> {
    const res = await firstValueFrom(
      this.http.get<{ publicKey: string }>(`${this.base}/vapid-public-key`)
    );
    return res.publicKey;
  }

  async list(): Promise<ReminderResponse[]> {
    return firstValueFrom(this.http.get<ReminderResponse[]>(this.base));
  }

  async upsert(req: UpsertReminderRequest): Promise<ReminderResponse> {
    return firstValueFrom(this.http.post<ReminderResponse>(this.base, req));
  }

  async delete(habitId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.base}/${habitId}`));
  }
}
