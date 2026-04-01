export interface AppResponse {
  id: number;
  name: string;
  description: string;
  url: string;
  environment: 'DEVELOPMENT' | 'UAT' | 'PRODUCTION';
  createdAt: string;
  updatedAt: string;
  totalChecks: number;
  activeChecks: number;
}

export interface CreateAppRequest {
  name: string;
  description?: string;
  url: string;
  environment: 'DEVELOPMENT' | 'UAT' | 'PRODUCTION';
}

export interface UpdateAppRequest {
  name?: string;
  description?: string;
  url?: string;
  environment?: 'DEVELOPMENT' | 'UAT' | 'PRODUCTION';
}
