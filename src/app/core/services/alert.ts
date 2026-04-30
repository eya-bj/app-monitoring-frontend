import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/constant';

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
  joinedGroup?: boolean;
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
  private baseUrl = API_BASE_URL;
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
      `${this.baseUrl}/apps/${appId}/alerts`, { params });
  }

  getChildren(groupId: number): Observable<AlertListItemDTO[]> {
    return this.http.get<AlertListItemDTO[]>(
      `${this.baseUrl}/alerts/groups/${groupId}/children`);
  }

  acknowledge(id: number, isGroup: boolean): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/alerts/${id}/acknowledge?isGroup=${isGroup}`, {});
  }

  resolve(id: number, isGroup: boolean): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/alerts/${id}/resolve?isGroup=${isGroup}`, {});
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/alerts/unread-count`);
  }

  getTodayAlerts(): Observable<AlertListItemDTO[]> {
    return this.http.get<AlertListItemDTO[]>(`${this.baseUrl}/alerts/today`);
  }

}
