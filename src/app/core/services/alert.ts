import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AlertListItemDTO {
  id: number;
  appName: string;
  appId: number;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
  group: boolean;
  failureCount?: number;
  childCount?: number;
  suggestedAction?: string;
  createdAt: string;
  updatedAt: string | null;
  children?: AlertListItemDTO[];
}

export interface AlertPage {
  content: AlertListItemDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private base = 'http://localhost:8080/api';
  private http = inject(HttpClient);

  getAlerts(appId: number, filters: {
    status?: string;
    severity?: string;
    page?: number;
    size?: number;
  }): Observable<AlertPage> {
    let params = new HttpParams();
    if (filters.status)   params = params.set('status', filters.status);
    if (filters.severity) params = params.set('severity', filters.severity);
    params = params.set('page', filters.page ?? 0);
    params = params.set('size', filters.size ?? 10);
    return this.http.get<AlertPage>(
      `${this.base}/apps/${appId}/alerts`, { params });
  }

  getChildren(groupId: number): Observable<AlertListItemDTO[]> {
    return this.http.get<AlertListItemDTO[]>(
      `${this.base}/alerts/groups/${groupId}/children`);
  }

  acknowledge(id: number, isGroup: boolean): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/alerts/${id}/acknowledge?isGroup=${isGroup}`, {});
  }

  resolve(id: number, isGroup: boolean): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/alerts/${id}/resolve?isGroup=${isGroup}`, {});
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.base}/alerts/unread-count`);
  }

  getTodayAlerts(): Observable<AlertListItemDTO[]> {
    return this.http.get<AlertListItemDTO[]>(`${this.base}/alerts/today`);
  }
  
}