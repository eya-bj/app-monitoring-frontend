import { Component, Input, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AlertRefreshService } from '../../../core/services/alert-refresh';
import { SuccessDialogComponent } from '../../../shared/components/success-dialog/success-dialog';
import { AlertService, AlertListItemDTO } from '../../../core/services/alert';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './app-alerts.html',
  styleUrl: './app-alerts.scss'
})
export class AppAlertsComponent implements OnInit {
  @Input() appId!: number;

  protected Math = Math;
  private alertService = inject(AlertService);
  private authService  = inject(AuthService);
  private dialog       = inject(MatDialog);
  private snackBar     = inject(MatSnackBar);

  private pollInterval: any;
  private initialLoad = true;

  private alertRefresh = inject(AlertRefreshService);


  currentUser = computed(() => this.authService.currentUser());
  isAdmin = computed(() =>
    this.currentUser()?.role === 'ADMIN' ||
    this.currentUser()?.role === 'SYSTEM_ADMIN'
  );

  
  // ── State ──────────────────────────────────────
  alerts       = signal<AlertListItemDTO[]>([]);
  loading      = signal(true);
  totalElements = signal(0);
  totalPages   = signal(0);

  // ── Filters ────────────────────────────────────
  filterStatus   = '';
  filterSeverity = '';
  currentPage    = 0;
  pageSize       = 10;

  // ── Expanded groups ────────────────────────────
  expandedGroups = new Set<number>();
  groupChildren  = new Map<number, AlertListItemDTO[]>();
  loadingChildren = new Set<number>();

  ngOnInit(): void {
    this.loadAlerts();
    this.initialLoad = false;
    this.pollInterval = setInterval(() => this.silentRefresh(), 30000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  silentRefresh(): void {
    this.alertService.getAlerts(this.appId, {
      status:   this.filterStatus   || undefined,
      severity: this.filterSeverity || undefined,
      page:     this.currentPage,
      size:     this.pageSize
    }).subscribe({
      next: (page) => {
        this.alerts.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
      }
    });
  }

  loadAlerts(): void {
    if (this.initialLoad) this.loading.set(true);
    this.alertService.getAlerts(this.appId, {
      status:   this.filterStatus   || undefined,
      severity: this.filterSeverity || undefined,
      page:     this.currentPage,
      size:     this.pageSize
    }).subscribe({
      next: (page) => {
        this.alerts.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadAlerts();
  }

  resetFilters(): void {
    this.filterStatus   = '';
    this.filterSeverity = '';
    this.currentPage    = 0;
    this.loadAlerts();
  }

  // ── Pagination ─────────────────────────────────
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage = page;
    this.loadAlerts();
  }

  // ── Expand/Collapse group ──────────────────────
  toggleGroup(alert: AlertListItemDTO): void {
    if (!alert.group) return;

    if (this.expandedGroups.has(alert.id)) {
      this.expandedGroups.delete(alert.id);
      return;
    }

    this.expandedGroups.add(alert.id);

    if (!this.groupChildren.has(alert.id)) {
      this.loadingChildren.add(alert.id);
      this.alertService.getChildren(alert.id).subscribe({
        next: (children) => {
          this.groupChildren.set(alert.id, children);
          this.loadingChildren.delete(alert.id);
        },
        error: () => this.loadingChildren.delete(alert.id)
      });
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedGroups.has(id);
  }

  getChildren(id: number): AlertListItemDTO[] {
    return this.groupChildren.get(id) ?? [];
  }

  isLoadingChildren(id: number): boolean {
    return this.loadingChildren.has(id);
  }

  acknowledge(alert: AlertListItemDTO): void {
    this.alertService.acknowledge(alert.id, alert.group).subscribe({
      next: () => {
        this.alertRefresh.triggerRefresh();
        this.dialog.open(SuccessDialogComponent, {
          position: { top: '80px' },
          data: { title: 'Alert Acknowledged', message: 'Alert has been acknowledged successfully.' }
        });
        this.loadAlerts();
      },
      error: (err) => this.snackBar.open(
        err?.error?.message || 'Failed to acknowledge', 'Close', { duration: 3000 })
    });
  }

  resolve(alert: AlertListItemDTO): void {
    this.alertService.resolve(alert.id, alert.group).subscribe({
      next: () => {
        this.alertRefresh.triggerRefresh();
        this.dialog.open(SuccessDialogComponent, {
          position: { top: '80px' },
          data: { title: 'Alert Resolved', message: 'Alert has been resolved successfully.' }
        });
        this.loadAlerts();
      },
      error: (err) => this.snackBar.open(
        err?.error?.message || 'Failed to resolve', 'Close', { duration: 3000 })
    });
  }

  // ── Helpers ────────────────────────────────────
  getSeverityClass(severity: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'as-critical',
      WARNING:  'as-warning',
      INFO:     'as-info'
    };
    return map[severity] ?? '';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      NEW:          'status-new',
      ACKNOWLEDGED: 'status-ack',
      RESOLVED:     'status-resolved'
    };
    return map[status] ?? '';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }
}