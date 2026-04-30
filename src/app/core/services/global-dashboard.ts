import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/constant';

export interface GlobalSummary {
  totalApps: number;
  healthyApps: number;
  warningApps: number;
  criticalApps: number;
  unknownApps: number;
}

export interface AppGlobalCard {
  appId: number;
  appName: string;
  description: string;
  environment: string;
  totalChecks: number;
  passedLast24h: number;
  failedLast24h: number;
  passRate: number;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  lastExecution: string | null;
  lastFailure: string | null;
  newAlerts: number;
  acknowledgedAlerts: number;
}

export interface GlobalDashboardResponse {
  summary: GlobalSummary;
  apps: AppGlobalCard[];
}

export interface CriticalAlertDTO {
  alertId: number;
  appId: number;
  appName: string;
  message: string;
  group: boolean;
  childCount?: number;
  createdAt: string;
  failureCount?: number;
}

@Injectable({ providedIn: 'root' })
export class GlobalDashboardService {
  private base = API_BASE_URL;
  private http = inject(HttpClient);

  getGlobalDashboard(): Observable<GlobalDashboardResponse> {
    return this.http.get<GlobalDashboardResponse>(`${this.base}/dashboard/global`);
  }

  getCriticalAlerts(): Observable<CriticalAlertDTO[]> {
    return this.http.get<CriticalAlertDTO[]>(`${this.base}/dashboard/critical-alerts`);
  }
}
