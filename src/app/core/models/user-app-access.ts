export interface AssignUserToAppRequest {
  userId: number;
  appId: number;
}

export interface UserAppResponse {
  id: number;
  userId: number;
  name: string;
  appId: number;
  appName: string;
  assignedAt: string;
  assignerId: number;
  assignerName: string;
}
