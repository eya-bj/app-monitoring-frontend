export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  name: string;
  token: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: string;
}

export interface UpdateUserRequest {
  role: string;
}

export interface EditProfileRequest {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface EditProfileResponse {
  user: UserResponse;
  token: string;
}
