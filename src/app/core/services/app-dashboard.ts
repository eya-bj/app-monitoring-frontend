import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CheckTypeStatsDTO {
  checkType: string;
  passed: number;
  failed: number;
  passRate: number;
}

export interface AppDashboardStatsDTO {
  totalChecks: number;
  passedLast24h: number;
  failedLast24h: number;
  passRate: number;
  lastExecution: string | null;
  nextExecution: string | null;
  newAlerts: number;
  acknowledgedAlerts: number;
  resolvedToday: number;
  checkTypeBreakdown: CheckTypeStatsDTO[];
}

export interface DailyResultDTO {
  date: string;
  passed: number;
  failed: number;
}


export interface LatestCheckResultDTO {
  checkId: number;
  checkName: string;
  checkType: string;
  status: string;
  lastExecutedAt: string;
  durationMs: number;
  nextExecution: string | null;
}

export interface ActiveAlertDTO {
  id: number;
  group: boolean;
  severity: string;
  message: string;
  consecutiveFailures: number;
  childCount: number | null;
  aiSummary: string | null;
  createdAt: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class AppDashboardService {

  private base = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getAppStats(appId: number, params?: any): Observable<AppDashboardStatsDTO> {
    return this.http.get<AppDashboardStatsDTO>(
      `${this.base}/apps/${appId}/dashboard/stats`,
      { params }
    );
  }

  getTimeline(appId: number, params?: any): Observable<DailyResultDTO[]> {
    return this.http.get<DailyResultDTO[]>(
      `${this.base}/apps/${appId}/dashboard/timeline`,
      { params }
    );
  }

  getLatest(appId: number): Observable<LatestCheckResultDTO[]> {
    return this.http.get<LatestCheckResultDTO[]>(
      `${this.base}/apps/${appId}/dashboard/latest`
    );
  }

  getActiveAlerts(appId: number): Observable<ActiveAlertDTO[]> {
    return this.http.get<ActiveAlertDTO[]>(
      `${this.base}/apps/${appId}/dashboard/active-alerts`
    );
  }
}
