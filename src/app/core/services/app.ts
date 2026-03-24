import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppResponse } from '../models/app';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private baseUrl = 'http://localhost:8080/api/apps';

  constructor(private http: HttpClient) {}

  getAllApps(): Observable<AppResponse[]> {
    return this.http.get<AppResponse[]>(this.baseUrl);
  }
}
