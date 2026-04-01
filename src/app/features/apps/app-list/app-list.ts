import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { AppService } from '../../../core/services/app';
import { AppResponse } from '../../../core/models/app';
import { AddAppDialogComponent } from '../add-app-dialog/add-app-dialog';
import { EditAppDialogComponent } from '../edit-app-dialog/edit-app-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SuccessDialogComponent } from '../../../shared/components/success-dialog/success-dialog';



@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule],
  templateUrl: './app-list.html',
  styleUrl: './app-list.scss',
})
export class AppListComponent implements OnInit {
  apps = signal<AppResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  searchQuery = '';
  selectedEnvironment = '';

  environmentOptions = [
    { value: '', label: 'All Environments' },
    { value: 'PRODUCTION', label: 'Production' },
    { value: 'UAT', label: 'UAT' },
    { value: 'DEVELOPMENT', label: 'Development' },
  ];

  constructor(
    private appService: AppService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  private showSuccess(title: string, message: string): void {
  this.dialog.open(SuccessDialogComponent, {
    position: { top: '80px' },
    data: { title, message },
  });
}

  ngOnInit(): void {
    this.loadApps();
  }

  loadApps(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.appService
      .getAllApps(
        this.searchQuery || undefined,
        this.selectedEnvironment || undefined
      )
      .subscribe({
        next: (data) => {
          this.apps.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Failed to load apps.');
          this.isLoading.set(false);
        },
      });
  }

  onSearch(): void {
    this.loadApps();
  }

  onEnvironmentChange(): void {
    this.loadApps();
  }

  viewApp(id: number): void {
    this.router.navigate(['/apps', id]);
  }

  openCreateDialog(): void {
  const ref = this.dialog.open(AddAppDialogComponent, {
    width: '480px',
  });
  ref.afterClosed().subscribe((result) => {
    if (result) {
      this.loadApps();
      this.showSuccess('App Created', 'Application has been created successfully.');
    }
  });
}

openEditDialog(app: AppResponse): void {
  const ref = this.dialog.open(EditAppDialogComponent, {
    width: '480px',
    data: { app },
  });
  ref.afterClosed().subscribe((result) => {
    if (result) {
      this.loadApps();
      this.showSuccess('App Updated', `"${app.name}" has been updated successfully.`);
    }
  });
}


  deleteApp(app: AppResponse): void {
  const ref = this.dialog.open(ConfirmDialogComponent, {
    width: '400px',
    data: {
      title: 'Delete App',
      message: `Are you sure you want to delete "${app.name}"? This will also delete all its checks.`,
      confirmLabel: 'Delete',
      danger: true,
    },
  });
  ref.afterClosed().subscribe((confirmed) => {
    if (confirmed) {
      this.appService.deleteApp(app.id).subscribe({
        next: () => {
          this.loadApps();
          this.showSuccess('App Deleted', `"${app.name}" has been deleted successfully.`);
        },
        error: () => this.errorMessage.set('Failed to delete app.'),
      });
    }
  });
}

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
}
