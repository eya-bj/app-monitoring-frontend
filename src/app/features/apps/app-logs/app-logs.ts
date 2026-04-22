import { Component, Input, OnInit, OnDestroy , signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CheckResultService } from '../../../core/services/check-result';
import { CheckResultResponse, ResultStatus } from '../../../core/models/check-result';
import { CheckType } from '../../../core/models/check';
import { PageResponse } from '../../../core/models/common';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MatIconModule, MatTooltipModule, MatSnackBarModule],
  templateUrl: './app-logs.html',
  styleUrl: './app-logs.scss',
})
export class AppLogsComponent implements OnInit {
  @Input() appId!: number;
  @Input() appName: string = '';

  Math = Math;

  // ─── State ────────────────────────────────────────────
  isLoading = signal(false);
  results = signal<CheckResultResponse[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  expandedResultId = signal<number | null>(null);

  // ─── Pagination ───────────────────────────────────────
  currentPage = signal(0);
  pageSize = signal(20);
  pageSizeOptions = [10, 20, 50];

  // ─── Filters ──────────────────────────────────────────
  filterStatus: ResultStatus | '' = '';
  filterCheckType: CheckType | '' = '';
  filterFrom = '';
  filterTo = '';
  // ─── Options ──────────────────────────────────────────
  statusOptions: ResultStatus[] = ['PASSED', 'FAILED'];
  checkTypeOptions: CheckType[] = ['CLUSTER', 'DATA', 'FILE'];
  // ─── Export ───────────────────────────────────────────
  isExporting = signal(false);
  showExportMenu = signal(false);

  private pollInterval: any;
  private initialLoad = true;


  constructor(private checkResultService: CheckResultService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadResults();
    this.initialLoad = false;
    this.pollInterval = setInterval(() => this.silentRefresh(), 30000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  silentRefresh(): void {
    this.checkResultService.getAppResults(
      this.appId,
      this.currentPage(),
      this.pageSize(),
      this.filterStatus || undefined,
      this.filterCheckType as CheckType || undefined,
      this.filterFrom || undefined,
      this.filterTo || undefined,
    ).subscribe({
      next: (page: PageResponse<CheckResultResponse>) => {
        this.results.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
      }
    });
  }

  // ─── Load ─────────────────────────────────────────────
  loadResults(): void {
    if (this.initialLoad) this.isLoading.set(true);
    this.checkResultService.getAppResults(
      this.appId,
      this.currentPage(),
      this.pageSize(),
      this.filterStatus || undefined,
      this.filterCheckType as CheckType || undefined,
      this.filterFrom || undefined,
      this.filterTo || undefined,
    ).subscribe({
      next: (page: PageResponse<CheckResultResponse>) => {
        this.results.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // ─── Filters ──────────────────────────────────────────

  getCurrentTime(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  getMaxDateTime(): string {
    const now = new Date();
    // Format: 2026-04-19T15:30
    return now.toISOString().slice(0, 16);
  }

  applyFilters(): void {
    const currentTime = this.getCurrentTime();

    if (this.filterFrom && this.filterFrom > currentTime) {
      this.snackBar.open('"From" time cannot be in the future.', 'Close', { duration: 3000 });
      return;
    }

    if (this.filterTo && this.filterTo > currentTime) {
      this.snackBar.open('"To" time cannot be in the future.', 'Close', { duration: 3000 });
      return;
    }

    if (this.filterFrom && this.filterTo && this.filterFrom >= this.filterTo) {
          this.snackBar.open('"From" time must be before "To" time.', 'Close', {duration: 3000});
          return;
        }

    this.currentPage.set(0);
    this.loadResults();
  }

  resetFilters(): void {
  this.filterStatus = '';
  this.filterCheckType = '';
  this.filterFrom = '';
  this.filterTo = '';
  this.currentPage.set(0);
  this.loadResults();
}

  // ─── Pagination ───────────────────────────────────────
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadResults();
  }

  onPageSizeChange(): void {
    this.currentPage.set(0);
    this.loadResults();
  }

  // ─── Expand ───────────────────────────────────────────
  toggleExpand(resultId: number): void {
    this.expandedResultId.set(
      this.expandedResultId() === resultId ? null : resultId
    );
  }

  isExpanded(resultId: number): boolean {
    return this.expandedResultId() === resultId;
  }

  // ─── Export ───────────────────────────────────────────
  toggleExportMenu(): void {
    this.showExportMenu.set(!this.showExportMenu());
  }

  exportResults(format: 'pdf' | 'excel'): void {
    this.showExportMenu.set(false);
    this.isExporting.set(true);

    this.checkResultService.exportResults(
      this.appId,
      format,
      this.filterStatus || undefined,
      this.filterCheckType || undefined,
      this.filterFrom || undefined,
      this.filterTo || undefined,
    ).subscribe({
      next: (blob: Blob) => {
        const ext = format === 'pdf' ? 'pdf' : 'xlsx';
        const appName = (this.appName || 'app').replace(/\s+/g, '_');
        const status = this.filterStatus ? `_${this.filterStatus}` : '';
        const type = this.filterCheckType ? `_${this.filterCheckType}` : '';
        const from = this.filterFrom ? `_from-${this.filterFrom.substring(0, 10)}` : '';
        const to = this.filterTo ? `_to-${this.filterTo.substring(0, 10)}` : '';
        const filename = `${appName}_results${status}${type}${from}${to}.${ext}`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        this.isExporting.set(false);
      },
      error: () => {
        this.isExporting.set(false);
      }
    });
  }
  // ─── Helpers ──────────────────────────────────────────
  getStatusClass(status: ResultStatus): string {
    return status === 'PASSED' ? 'badge badge-passed' : 'badge badge-failed';
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
      CLUSTER: 'Cluster', DATA: 'Data', FILE: 'File',
    };
    return map[type] ?? type;
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }
}
