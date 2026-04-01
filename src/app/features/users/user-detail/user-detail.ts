import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { UserService } from '../../../core/services/user';
import { AuthService } from '../../../core/services/auth';
import { AppAccessService } from '../../../core/services/app-access';
import { AppService } from '../../../core/services/app';
import { UserResponse, UpdateUserRequest } from '../../../core/models/user';
import { AppResponse } from '../../../core/models/app';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SuccessDialogComponent } from '../../../shared/components/success-dialog/success-dialog';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.scss',
})
export class UserDetailComponent implements OnInit {
  user = signal<UserResponse | null>(null);
  userApps = signal<AppResponse[]>([]);
  allApps = signal<AppResponse[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  selectedRole = signal('');
  readonly roleOptions = [
    { value: 'USER', label: 'Normal User' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  showAssignModal = signal(false);
  selectedAppId = signal<number | null>(null);

  currentUser = computed(() => this.authService.currentUser());
  isSystemAdmin = computed(() => this.currentUser()?.role === 'SYSTEM_ADMIN');

  availableApps = computed(() => {
    const assignedIds = this.userApps().map(a => a.id);
    return this.allApps().filter(a => !assignedIds.includes(a.id));
  });

  private userId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private appAccessService: AppAccessService,
    private appService: AppService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAll();
  }

  private showSuccess(title: string, message: string): void {
    this.dialog.open(SuccessDialogComponent, {
      position: { top: '80px' },
      data: { title, message },
    });
  }

  loadAll(): void {
    this.isLoading.set(true);
    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user.set(user);
        this.selectedRole.set(user.role);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load user.');
        this.isLoading.set(false);
      },
    });

    this.appAccessService.getAppsForUser(this.userId).subscribe({
      next: (apps: AppResponse[]) => this.userApps.set(apps),
    });

    this.appService.getAllApps().subscribe({
      next: (apps) => this.allApps.set(apps),
    });
  }

  updateRole(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      position: { top: '80px' },
      data: {
        title: 'Update Role',
        message: `Are you sure you want to change ${this.user()?.name}'s role to ${this.selectedRole()}?`,
        confirmLabel: 'Update',
        cancelLabel: 'Cancel',
        isDanger: false,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      const request: UpdateUserRequest = { role: this.selectedRole() };
      this.userService.updateUserRole(this.userId, request).subscribe({
        next: () => {
          this.showSuccess('Role Updated', `${this.user()?.name}'s role has been updated to ${this.selectedRole()}.`);
          this.loadAll();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to update role.', 'Close', { duration: 3000 });
        },
      });
    });
  }

  deleteUser(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      position: { top: '80px' },
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete ${this.user()?.name}? This action cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        isDanger: true,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.userService.deleteUser(this.userId).subscribe({
        next: () => {
          this.showSuccess('User Deleted', `${this.user()?.name} has been deleted successfully.`);
          this.router.navigate(['/users']);
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to delete user.', 'Close', { duration: 3000 });
        },
      });
    });
  }

  openAssignModal(): void {
    this.selectedAppId.set(null);
    this.showAssignModal.set(true);
  }

  closeAssignModal(): void {
    this.showAssignModal.set(false);
  }

  assignApp(): void {
    const appId = this.selectedAppId();
    if (!appId) return;
    this.appAccessService.assignUserToApp({ userId: this.userId, appId }).subscribe({
      next: () => {
        this.showSuccess('App Assigned', 'Application has been assigned successfully.');
        this.closeAssignModal();
        this.loadAll();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to assign app.', 'Close', { duration: 3000 });
      },
    });
  }

  revokeApp(appId: number): void {
    const app = this.userApps().find(a => a.id === appId);
    const ref = this.dialog.open(ConfirmDialogComponent, {
      position: { top: '80px' },
      data: {
        title: 'Revoke Access',
        message: `Are you sure you want to revoke access to ${app?.name} for ${this.user()?.name}?`,
        confirmLabel: 'Revoke',
        cancelLabel: 'Cancel',
        isDanger: true,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.appAccessService.revokeUserFromApp(this.userId, appId).subscribe({
        next: () => {
          this.showSuccess('Access Revoked', `Access to ${app?.name} has been revoked successfully.`);
          this.loadAll();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to revoke access.', 'Close', { duration: 3000 });
        },
      });
    });
  }

  canDelete(): boolean {
    const role = this.currentUser()?.role;
    const userRole = this.user()?.role;
    if (userRole === 'SYSTEM_ADMIN') return false;
    if (userRole === 'ADMIN' && role !== 'SYSTEM_ADMIN') return false;
    return true;
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'SYSTEM_ADMIN': return 'badge badge-system-admin';
      case 'ADMIN': return 'badge badge-admin';
      default: return 'badge badge-user';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'SYSTEM_ADMIN': return 'System Admin';
      case 'ADMIN': return 'Admin';
      default: return 'Normal User';
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }
}
