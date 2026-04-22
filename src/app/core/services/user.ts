import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  EditProfileRequest,
  ResetPasswordRequest,
  EditProfileResponse
} from '../models/user';
import { PageResponse } from '../models/common';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  createUser(request: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.baseUrl, request);
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/${id}`);
  }

  getAllUsers(filters?: {
  userName?: string;
  email?: string;
  role?: string;
  page?: number;
  size?: number;
}): Observable<PageResponse<UserResponse>> {
  let params = new HttpParams();
  if (filters?.userName) params = params.set('userName', filters.userName);
  if (filters?.email) params = params.set('email', filters.email);
  if (filters?.role) params = params.set('role', filters.role);
  if (filters?.page !== undefined) params = params.set('page', filters.page.toString());
  if (filters?.size !== undefined) params = params.set('size', filters.size.toString());
  return this.http.get<PageResponse<UserResponse>>(this.baseUrl, { params });
}

  updateUserRole(id: number, request: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/${id}/update-role`, request);
  }

  editProfile(userId: number, request: any): Observable<EditProfileResponse> {
    return this.http.put<EditProfileResponse>(
      `${this.baseUrl}/${userId}/edit-profile`, request
    );
  }

  resetPassword(id: number, request: ResetPasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/reset-password`, request);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
