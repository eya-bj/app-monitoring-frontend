import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssignUserToAppRequest, UserAppResponse } from '../models/user-app-access';
import { UserResponse } from '../models/user';
import { AppResponse } from '../models/app';

@Injectable({
  providedIn: 'root',
})
export class AppAccessService {
  private baseUrl = 'http://localhost:8080/api/user-app-access';

  constructor(private http: HttpClient) {}

  assignUserToApp(request: AssignUserToAppRequest): Observable<UserAppResponse> {
    return this.http.post<UserAppResponse>(`${this.baseUrl}/assign`, request);
  }

  revokeUserFromApp(userId: number, appId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/revoke/${userId}/${appId}`);
  }

  getUsersWithAccessToApp(appId: number): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.baseUrl}/app/${appId}/users`);
  }

  getAppsForUser(userId: number): Observable<AppResponse[]> {
    return this.http.get<AppResponse[]>(`${this.baseUrl}/user/${userId}/apps`);
  }
}
