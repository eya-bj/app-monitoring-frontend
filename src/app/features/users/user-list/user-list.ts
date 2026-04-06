import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UserService } from '../../../core/services/user';
import { AuthService } from '../../../core/services/auth';
import { AppAccessService } from '../../../core/services/app-access';
import { UserResponse } from '../../../core/models/user';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AddUserDialogComponent } from '../add-user-dialog/add-user-dialog';
import { SuccessDialogComponent } from '../../../shared/components/success-dialog/success-dialog';
import { AppResponse } from '../../../core/models/app';
import { AppService } from '../../../core/services/app';
import { AssignAppDialogComponent } from '../assign-app-dialog/assign-app-dialog';

@Component({
  selector: 'app-user-list',
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
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserListComponent implements OnInit {
  users = signal<UserResponse[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  appCounts = signal<Map<number, number>>(new Map());

  searchQuery = signal('');
  selectedRole = signal('');

  currentPage = signal(0);
  pageSize = signal(10);
  totalElements = signal(0);
  totalPages = signal(0);

  currentUser = computed(() => this.authService.currentUser());

  readonly roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'USER', label: 'Normal User' },
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private appAccessService: AppAccessService,
    private appService: AppService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private showSuccess(title: string, message: string): void {
  this.dialog.open(SuccessDialogComponent, {
    position: { top: '80px' },
    data: { title, message },
  });
}

  loadUsers(): void {
  this.isLoading.set(true);
  this.userService.getAllUsers({
    userName: this.searchQuery() || undefined,
    role: this.selectedRole() || undefined,
    page: this.currentPage(),
    size: this.pageSize(),
  }).subscribe({
    next: (data) => {
      const userList = data.content ? data.content : data;
      if (data.content) {
        this.totalElements.set(data.totalElements);
        this.totalPages.set(data.totalPages);
      }
      this.users.set(userList);
      this.isLoading.set(false);

      if (userList.length > 0) {
        const requests = userList.map((user: UserResponse) =>
          this.appAccessService.getAppsForUser(user.id)
        );
        forkJoin<any[]>(requests).subscribe({
          next: (results: any[]) => {
            const map = new Map<number, number>();
            userList.forEach((user: UserResponse, index: number) => {
              map.set(user.id, results[index].length);
            });
            this.appCounts.set(map);
          },
        });
      }
    },
    error: () => {
      this.errorMessage.set('Failed to load users.');
      this.isLoading.set(false);
    },
  });
}

  onSearch(): void {
    this.currentPage.set(0);
    this.loadUsers();
  }

  onRoleChange(): void {
    this.currentPage.set(0);
    this.loadUsers();
  }

  viewUser(id: number): void {
    this.router.navigate(['/users', id]);
  }

  deleteUser(id: number): void {
    const user = this.users().find(u => u.id === id);
    const ref = this.dialog.open(ConfirmDialogComponent, {
      position: { top: '80px' },
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete ${user?.name}? This action cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        isDanger: true,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.showSuccess('User Deleted', `${user?.name} has been deleted successfully.`);
          this.loadUsers();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to delete user.', 'Close', { duration: 3000 });
        },
      });
    });
  }

  canDelete(user: UserResponse): boolean {
    const role = this.currentUser()?.role;
    if (user.role === 'SYSTEM_ADMIN') return false;
    if (user.role === 'ADMIN' && role !== 'SYSTEM_ADMIN') return false;
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

  getAppCount(userId: number): string {
    const role = this.currentUser()?.role;
    const count = this.appCounts().get(userId);
    if (count === undefined) return '—';
    if (count === 0 && (role === 'SYSTEM_ADMIN' || role === 'ADMIN')) return 'All apps';
    if (count === 0) return 'No access';
    return count === 1 ? '1 application' : `${count} applications`;
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadUsers();
    }
  }
  openAddUserDialog(): void {
    const ref = this.dialog.open(AddUserDialogComponent, {
      position: { top: '80px' },
      disableClose: true,
    });

    ref.afterClosed().subscribe((result: { created: boolean; user: any; assign: boolean } | null) => {
      if (!result?.created) return;
      this.loadUsers();

      if (result.assign) {
        this.openAssignAppDialog(result.user);
      }
    });
  }

  private openAssignAppDialog(user: any): void {
    this.appService.getAllApps().subscribe({
      next: (apps: AppResponse[]) => {
        // get already assigned apps first
        this.appAccessService.getAppsForUser(user.id).subscribe({
          next: (assignedApps: AppResponse[]) => {
            const assignedIds = assignedApps.map(a => a.id);
            const availableApps = apps.filter(a => !assignedIds.includes(a.id));

            if (availableApps.length === 0) {
              this.showSuccess('No Apps Available', 'There are no applications available to assign.');
              return;
            }

            // show a simple select dialog — we'll use the confirm pattern
            // but we need app selection, so we handle it inline
            this.showAppSelectionDialog(user, availableApps);
          },
        });
      },
    });
  }

    private showAppSelectionDialog(user: any, apps: AppResponse[]): void {
    const ref = this.dialog.open(AssignAppDialogComponent, {
      position: { top: '80px' },
      data: {
        userId: user.id,
        userName: user.name,
        availableApps: apps,
      },
    });

    ref.afterClosed().subscribe((assigned: boolean) => {
      if (assigned) {
        this.showSuccess('App Assigned', `Application has been assigned to ${user.name} successfully.`);
        this.loadUsers();
      }
    });
  }
}

