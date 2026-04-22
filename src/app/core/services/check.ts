import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CheckResponse,
  CheckType,
  CheckStatus,
  CreateClusterCheckRequest,
  CreateDataCheckRequest,
  CreateFileCheckRequest,
  UpdateClusterCheckRequest,
  UpdateDataCheckRequest,
  UpdateFileCheckRequest,
} from '../models/check';

@Injectable({
  providedIn: 'root',
})
export class CheckService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ─── Get ──────────────────────────────────────────────

  getChecksByApp(
    appId: number,
    checkType?: CheckType,
    status?: CheckStatus
  ): Observable<CheckResponse[]> {
    let params = new HttpParams();
    if (checkType) params = params.set('checkType', checkType);
    if (status) params = params.set('status', status);
    return this.http.get<CheckResponse[]>(
      `${this.baseUrl}/apps/${appId}/checks`,
      { params }
    );
  }

  getCheckById(id: number): Observable<CheckResponse> {
    return this.http.get<CheckResponse>(`${this.baseUrl}/checks/${id}`);
  }

  // ─── Create ───────────────────────────────────────────

  createClusterCheck(
    appId: number,
    request: CreateClusterCheckRequest
  ): Observable<CheckResponse> {
    return this.http.post<CheckResponse>(
      `${this.baseUrl}/apps/${appId}/checks/cluster`,
      request
    );
  }

  createDataCheck(
    appId: number,
    request: CreateDataCheckRequest
  ): Observable<CheckResponse> {
    return this.http.post<CheckResponse>(
      `${this.baseUrl}/apps/${appId}/checks/data`,
      request
    );
  }

  createFileCheck(
    appId: number,
    request: CreateFileCheckRequest
  ): Observable<CheckResponse> {
    return this.http.post<CheckResponse>(
      `${this.baseUrl}/apps/${appId}/checks/file`,
      request
    );
  }

  // ─── Update ───────────────────────────────────────────

  updateClusterCheck(
    id: number,
    request: UpdateClusterCheckRequest
  ): Observable<CheckResponse> {
    return this.http.put<CheckResponse>(
      `${this.baseUrl}/checks/${id}/cluster`,
      request
    );
  }

  updateDataCheck(
    id: number,
    request: UpdateDataCheckRequest
  ): Observable<CheckResponse> {
    return this.http.put<CheckResponse>(
      `${this.baseUrl}/checks/${id}/data`,
      request
    );
  }

  updateFileCheck(
    id: number,
    request: UpdateFileCheckRequest
  ): Observable<CheckResponse> {
    return this.http.put<CheckResponse>(
      `${this.baseUrl}/checks/${id}/file`,
      request
    );
  }

  // ─── Delete / Enable / Disable ────────────────────────

  deleteCheck(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/checks/${id}`);
  }

  enableCheck(id: number): Observable<CheckResponse> {
    return this.http.patch<CheckResponse>(
      `${this.baseUrl}/checks/${id}/enable`,
      {}
    );
  }

  disableCheck(id: number): Observable<CheckResponse> {
    return this.http.patch<CheckResponse>(
      `${this.baseUrl}/checks/${id}/disable`,
      {}
    );
  }

  runAllChecks(appId: number, checkIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/apps/${appId}/checks/run-now`, checkIds);
  }

}
