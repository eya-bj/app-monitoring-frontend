import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AppService } from '../../../core/services/app';
import { AppAccessService } from '../../../core/services/app-access';
import { AuthService } from '../../../core/services/auth';
import { AppResponse } from '../../../core/models/app';
import { UserResponse } from '../../../core/models/user';
import { UserService } from '../../../core/services/user';
import { CheckResponse, CheckType, CheckStatus } from '../../../core/models/check';
import { CheckService } from '../../../core/services/check';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SuccessDialogComponent } from '../../../shared/components/success-dialog/success-dialog';
import { EditAppDialogComponent } from '../edit-app-dialog/edit-app-dialog';
import { CronHumanPipe } from '../../../shared/pipes/cron-human-pipe';


@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    CronHumanPipe,
  ],
  templateUrl: './app-detail.html',
  styleUrl: './app-detail.scss',
})
export class AppDetailComponent implements OnInit {
  app = signal<AppResponse | null>(null);
  appUsers = signal<UserResponse[]>([]);
  allUsers = signal<UserResponse[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  activeTab = signal<'info' | 'checks' | 'users'>('info');

  showAssignModal = signal(false);
  selectedUserId = signal<number | null>(null);

  checks = signal<CheckResponse[]>([]);
  checksLoading = signal(false);
  selectedCheckType = signal<CheckType | ''>('');
  selectedCheckStatus = signal<CheckStatus | ''>('');

  currentUser = computed(() => this.authService.currentUser());
  isAdmin = computed(() =>
    this.currentUser()?.role === 'ADMIN' ||
    this.currentUser()?.role === 'SYSTEM_ADMIN'
  );

  availableUsers = computed(() => {
    const assignedIds = this.appUsers().map(u => u.id);
    return this.allUsers().filter(u =>
      !assignedIds.includes(u.id) && u.role === 'USER'
    );
  });

  private appId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appService: AppService,
    private appAccessService: AppAccessService,
    private authService: AuthService,
    private userService: UserService,
    private checkService: CheckService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

ngOnInit(): void {
  this.appId = Number(this.route.snapshot.paramMap.get('id'));
  this.loadAll();

  const tab = this.route.snapshot.queryParams['tab'];
  const action = this.route.snapshot.queryParams['action'];

  if (tab === 'checks') {
    this.activeTab.set('checks');
    this.loadChecks();
  }

  if (action === 'created') {
    this.showSuccess('Check Created', 'Check has been created successfully.');
  }
  if (action === 'deleted') {
    this.showSuccess('Check Deleted', 'Check has been deleted successfully.');
  }
}



  // ─── Tab ──────────────────────────────────────────────

  setTab(tab: 'info' | 'checks' | 'users'): void {
    this.activeTab.set(tab);
    if (tab === 'checks') this.loadChecks();
  }

  loadChecks(): void {
  this.checksLoading.set(true);
  this.checkService.getChecksByApp(
    this.appId,
    this.selectedCheckType() || undefined,
    this.selectedCheckStatus() || undefined
  ).subscribe({
    next: (checks) => {
      this.checks.set(checks);
      this.checksLoading.set(false);
    },
    error: () => {
      this.checksLoading.set(false);
    },
  });
}

  // ─── Load ─────────────────────────────────────────────

  private showSuccess(title: string, message: string): void {
    this.dialog.open(SuccessDialogComponent, {
      position: { top: '80px' },
      data: { title, message },
    });
  }

  loadAll(): void {
    this.isLoading.set(true);
    this.appService.getAppById(this.appId).subscribe({
      next: (app) => {
        this.app.set(app);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load application.');
        this.isLoading.set(false);
      },
    });

    this.appAccessService.getUsersWithAccessToApp(this.appId).subscribe({
      next: (users: UserResponse[]) => this.appUsers.set(users),
    });

    this.userService.getAllUsers().subscribe({
      next: (response) => {
        this.allUsers.set(response.content ?? response);
      },
    });
  }

  // ─── App Actions ──────────────────────────────────────

  openEditDialog(): void {
    const ref = this.dialog.open(EditAppDialogComponent, {
      width: '480px',
      data: { app: this.app() },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAll();
        this.showSuccess('App Updated', 'Application has been updated successfully.');
      }
    });
  }

  deleteApp(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      position: { top: '80px' },
      data: {
        title: 'Delete App',
        message: `Are you sure you want to delete "${this.app()?.name}"? This will also delete all its checks.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        isDanger: true,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.appService.deleteApp(this.appId).subscribe({
        next: () => {
          this.showSuccess('App Deleted', `"${this.app()?.name}" has been deleted successfully.`);
          this.router.navigate(['/apps']);
        },
        error: (err: any) => {
          this.snackBar.open(
            err?.error?.message || 'Failed to delete application.',
            'Close', { duration: 3000 }
          );
        },
      });
    });
  }

  // ─── Check Actions ────────────────────────────────────

openAddCheckDialog(): void {
  this.router.navigate(['/apps', this.appId, 'checks', 'add']);
}

  // ─── User Access Actions ──────────────────────────────

  openAssignModal(): void {
    this.selectedUserId.set(null);
    this.showAssignModal.set(true);
  }

  closeAssignModal(): void {
    this.showAssignModal.set(false);
  }

  assignUser(): void {
    const userId = this.selectedUserId();
    if (!userId) return;
    this.appAccessService.assignUserToApp({
      userId,
      appId: this.appId,
    }).subscribe({
      next: () => {
        this.showSuccess('User Assigned', 'User has been assigned successfully.');
        this.closeAssignModal();
        this.loadAll();
      },
      error: (err: any) => {
        this.snackBar.open(
          err?.error?.message || 'Failed to assign user.',
          'Close', { duration: 3000 }
        );
      },
    });
  }

  revokeUser(userId: number): void {
    const user = this.appUsers().find(u => u.id === userId);
    const ref = this.dialog.open(ConfirmDialogComponent, {
      position: { top: '80px' },
      data: {
        title: 'Revoke Access',
        message: `Are you sure you want to revoke ${user?.name}'s access to this application?`,
        confirmLabel: 'Revoke',
        cancelLabel: 'Cancel',
        isDanger: true,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.appAccessService.revokeUserFromApp(userId, this.appId).subscribe({
        next: () => {
          this.showSuccess('Access Revoked', `${user?.name}'s access has been revoked.`);
          this.loadAll();
        },
        error: (err: any) => {
          this.snackBar.open(
            err?.error?.message || 'Failed to revoke access.',
            'Close', { duration: 3000 }
          );
        },
      });
    });
  }

  // ─── Helpers ──────────────────────────────────────────

  getEnvironmentBadgeClass(env: string): string {
    const map: Record<string, string> = {
      PRODUCTION: 'badge badge-production',
      UAT: 'badge badge-uat',
      DEVELOPMENT: 'badge badge-development',
    };
    return map[env] ?? 'badge';
  }

  getEnvironmentLabel(env: string): string {
    const map: Record<string, string> = {
      PRODUCTION: 'Production',
      UAT: 'UAT',
      DEVELOPMENT: 'Development',
    };
    return map[env] ?? env;
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
    this.router.navigate(['/apps']);
  }

  getCheckTypeBadgeClass(type: string): string {
  const map: Record<string, string> = {
    CLUSTER: 'badge badge-cluster',
    DATA: 'badge badge-data',
    FILE: 'badge badge-file',
  };
  return map[type] ?? 'badge';
}

getCheckTypeLabel(type: string): string {
  const map: Record<string, string> = {
    CLUSTER: 'Cluster',
    DATA: 'Data',
    FILE: 'File',
  };
  return map[type] ?? type;
}

getSeverityBadgeClass(severity: string): string {
  const map: Record<string, string> = {
    LOW: 'badge badge-low',
    MEDIUM: 'badge badge-medium',
    HIGH: 'badge badge-high',
    CRITICAL: 'badge badge-critical',
  };
  return map[severity] ?? 'badge';
}

viewCheck(checkId: number): void {
  this.router.navigate(['/apps', this.appId, 'checks', checkId]);
}

toggleCheck(check: CheckResponse): void {
  const action = check.status === 'ENABLED'
    ? this.checkService.disableCheck(check.id)
    : this.checkService.enableCheck(check.id);

  action.subscribe({
    next: () => {
      this.loadChecks();
      this.loadAll();
    },
    error: (err: any) => {
      this.snackBar.open(
        err?.error?.message || 'Failed to update check.',
        'Close', { duration: 3000 }
      );
    },
  });
}

deleteCheck(check: CheckResponse): void {
  const ref = this.dialog.open(ConfirmDialogComponent, {
    position: { top: '80px' },
    data: {
      title: 'Delete Check',
      message: `Are you sure you want to delete "${check.name}"?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDanger: true,
    },
  });
  ref.afterClosed().subscribe((confirmed) => {
    if (!confirmed) return;
    this.checkService.deleteCheck(check.id).subscribe({
      next: () => {
        this.loadChecks();
        this.loadAll();
        this.showSuccess('Check Deleted', `"${check.name}" has been deleted successfully.`);
      },
      error: () => this.errorMessage.set('Failed to delete check.'),
    });
  });
}
}
