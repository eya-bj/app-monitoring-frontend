import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CheckResultResponse, ResultStatus } from '../models/check-result';
import { CheckType } from '../models/check';
import { PageResponse } from '../models/common';
import { API_BASE_URL } from '../constants/constant';

@Injectable({
  providedIn: 'root',
})
export class CheckResultService {
  private baseUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  // ─── Recent results for check detail page ─────────────────────────────────

  getRecentResults(
    checkId: number,
    limit: number = 5
  ): Observable<CheckResultResponse[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<CheckResultResponse[]>(
      `${this.baseUrl}/checks/${checkId}/results`,
      { params }
    );
  }

  // ─── Paginated results for app logs tab ───────────────────────────────────

  getAppResults(
    appId: number,
    page: number = 0,
    size: number = 20,
    status?: ResultStatus,
    checkType?: CheckType,
    from?: string,
    to?: string
  ): Observable<PageResponse<CheckResultResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) params = params.set('status', status);
    if (checkType) params = params.set('checkType', checkType);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<PageResponse<CheckResultResponse>>(
      `${this.baseUrl}/apps/${appId}/results`,
      { params }
    );
  }

  // ─── Export results ───────────────────────────────────────────────

  exportResults(
  appId: number,
  format: 'pdf' | 'excel',
  status?: string,
  checkType?: string,
  from?: string,
  to?: string
): Observable<Blob> {
  let params = new HttpParams().set('format', format);
  if (status) params = params.set('status', status);
  if (checkType) params = params.set('checkType', checkType);
  if (from) params = params.set('from', from);
  if (to) params = params.set('to', to);

  return this.http.get(
    `${this.baseUrl}/apps/${appId}/results/export`,
    { params, responseType: 'blob' }
  );
}
}
