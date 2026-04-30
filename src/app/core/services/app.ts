import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AppResponse,
  CreateAppRequest,
  UpdateAppRequest,
} from '../models/app';
import { API_BASE_URL } from '../constants/constant';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private baseUrl = `${API_BASE_URL}/apps`;

  constructor(private http: HttpClient) {}

  getAllApps(
    name?: string,
    environment?: string
  ): Observable<AppResponse[]> {
    let params = new HttpParams();
    if (name) params = params.set('name', name);
    if (environment) params = params.set('environment', environment);
    return this.http.get<AppResponse[]>(this.baseUrl, { params });
  }

  getAppById(id: number): Observable<AppResponse> {
    return this.http.get<AppResponse>(`${this.baseUrl}/${id}`);
  }

  createApp(request: CreateAppRequest): Observable<AppResponse> {
    return this.http.post<AppResponse>(this.baseUrl, request);
  }

  updateApp(id: number, request: UpdateAppRequest): Observable<AppResponse> {
    return this.http.put<AppResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteApp(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
