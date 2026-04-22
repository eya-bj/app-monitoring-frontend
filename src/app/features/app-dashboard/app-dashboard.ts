import { Component, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router , ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { computed } from '@angular/core';
import { AlertRefreshService } from '../../core/services/alert-refresh';
import {
  AppDashboardService,
  AppDashboardStatsDTO,
  DailyResultDTO,
  LatestCheckResultDTO,
  ActiveAlertDTO
} from '../../core/services/app-dashboard';
import { AlertService } from '../../core/services/alert';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    BaseChartDirective,
  ],
  templateUrl: './app-dashboard.html',
  styleUrl: './app-dashboard.scss'
})
export class AppDashboard implements OnInit, OnDestroy {

  @Input() appId!: number;
  @Input() appName!: string;

  // ─── State ────────────────────────────────────────────
  stats          = signal<AppDashboardStatsDTO | null>(null);
  timeline = signal<DailyResultDTO[]>([]);  
  latest         = signal<LatestCheckResultDTO[]>([]);
  activeAlerts   = signal<ActiveAlertDTO[]>([]);

  statsLoading   = signal(true);
  chartsLoading  = signal(true);
  latestLoading  = signal(true);
  alertsLoading  = signal(true);

 // ─── Filters ──────────────────────────────────────────
  filterStatus = '';
  filterType   = '';

  initialLoad = true;

  private pollInterval: any;

  constructor(
    private dashboardService: AppDashboardService,
    private router: Router,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private authService: AuthService ,
    private alertRefresh: AlertRefreshService 

  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    this.filterStatus = params['status'] ?? '';
    this.filterType   = params['type']   ?? '';
    this.loadAll();
    this.startPolling();
    this.initialLoad = false;
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  

  // ─── Load ─────────────────────────────────────────────

  loadAll(): void {
    console.log('loadAll called at', new Date().toISOString());
    this.loadStats();
    this.loadTimeline();
    this.loadLatest();
    this.loadAlerts();
  }

  loadStats(): void {
    this.statsLoading.set(true);
    this.dashboardService.getAppStats(this.appId, this.buildFilterParams()).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.statsLoading.set(false);
        this.updateDoughnut();
      },
      error: () => this.statsLoading.set(false)
    });
  }

  loadTimeline(): void {
    if (this.initialLoad) this.chartsLoading.set(true);
    this.dashboardService.getTimeline(this.appId, this.buildFilterParams()).subscribe({
      next: (data: DailyResultDTO[]) => {
        this.timeline.set(data);
        this.updateLineChart(data);
        this.chartsLoading.set(false);
      },
      error: () => this.chartsLoading.set(false)
    });
  }

  loadLatest(): void {
    this.latestLoading.set(true);
    this.dashboardService.getLatest(this.appId).subscribe({
      next: (data) => {
        this.latest.set(data);
        this.latestLoading.set(false);
      },
      error: () => this.latestLoading.set(false)
    });
  }

  loadAlerts(): void {
    this.alertsLoading.set(true);
    this.dashboardService.getActiveAlerts(this.appId).subscribe({
      next: (data) => {
        this.activeAlerts.set(data);
        this.alertsLoading.set(false);
      },
      error: () => this.alertsLoading.set(false)
    });
  }

  currentUser = computed(() => this.authService.currentUser());
  isAdmin = computed(() =>
    this.currentUser()?.role === 'ADMIN' ||
    this.currentUser()?.role === 'SYSTEM_ADMIN'
  );

  // ─── Charts ───────────────────────────────────────────

  doughnutData: ChartData<'doughnut'> = {
    labels: ['Passed', 'Failed'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#64ce98', '#ef4444'],
      hoverBackgroundColor: ['#64ce98', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 0
    }]
  };

  doughnutOptions: ChartOptions<'doughnut'> = {
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
      hover: { mode: undefined }
  };

  lineData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Passed',
        data: [],
        borderColor: '#64ce98',
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true
      },
      {
        label: 'Failed',
        data: [],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true
      }
    ]
  };

  lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle'
        },
        onClick: () => {}
      },
      tooltip: {
        backgroundColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        titleColor: '#111827',
        bodyColor: '#6b7280',
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#9ca3af', font: { size: 12 } },
        grid: { color: '#e5e7eb' }
      },
      x: {
        ticks: { color: '#9ca3af', font: { size: 12 } },
        grid: { color: '#e5e7eb' }
      }
    }
  };

  updateDoughnut(): void {
    const s = this.stats();
    this.doughnutData = {
      labels: ['Passed', 'Failed'],
      datasets: [{
        data: [s?.passedLast24h ?? 0, s?.failedLast24h ?? 0],
        backgroundColor: ['#64ce98', '#ef4444'],
        hoverBackgroundColor: ['#64ce98', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 0

      }]
    };
  }

  updateLineChart(data: DailyResultDTO[]): void {
    this.lineData = {
      labels: data.map(d => d.date),
      datasets: [
        {
          label: 'Passed',
          data: data.map(d => d.passed ?? 0),
          borderColor: '#64ce98',
          backgroundColor: 'rgba(100,206,152,0.1)',
          borderWidth: 1.5,
          pointRadius: 2,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Failed',
          data: data.map(d => d.failed ?? 0),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.1)',
          borderWidth: 1.5,
          pointRadius: 2,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true
        }
      ]
    };
  }

    // ─── Helpers ──────────────────────────────────────────

    getPassRateClass(rate: number | undefined): string {
      if (rate === undefined || rate === null) return 'value-muted';
      if (rate >= 90) return 'value-green';
      if (rate >= 70) return 'value-yellow';
      return 'value-red';
    }

    getLastExecutionClass(last: string | null): string {
      if (!last) return 'value-muted';
      const diffMin = (Date.now() - new Date(last).getTime()) / 60000;
      if (diffMin < 5)  return 'value-green';
      if (diffMin < 15) return 'value-yellow';
      return 'value-red';
    }

    getNextExecutionClass(next: string | null): string {
      if (!next) return 'value-red';
      return new Date(next) > new Date() ? 'value-blue' : 'value-red';
    }

    getNewAlertsClass(count: number): string {
      if (count === 0) return 'value-green';
      if (count <= 2)  return 'value-yellow';
      return 'value-red';
    }

    getSeverityClass(severity: string): string {
      const map: Record<string, string> = {
        CRITICAL: 'badge-critical',
        WARNING:  'badge-warning',
        INFO:     'badge-info'
      };
      return map[severity] ?? '';
    }

    getTypeBadgeClass(type: string): string {
      const map: Record<string, string> = {
        CLUSTER: 'badge-cluster',
        DATA:    'badge-data',
        FILE:    'badge-file'
      };
      return map[type] ?? '';
    }

    getStatusBadgeClass(status: string): string {
      return status === 'PASSED' ? 'badge-passed' : 'badge-failed';
    }

    timeAgo(dateStr: string | null): string {
      if (!dateStr) return '—';
      const diff = Date.now() - new Date(dateStr).getTime();
      const min  = Math.floor(diff / 60000);
      if (min < 1)  return 'just now';
      if (min < 60) return `${min} min ago`;
      const h = Math.floor(min / 60);
      if (h < 24)   return `${h}h ago`;
      return `${Math.floor(h / 24)}d ago`;
    }

    timeFromNow(dateStr: string | null): string {
      if (!dateStr) return '—';
      const diff = new Date(dateStr).getTime() - Date.now();
      if (diff < 0) return 'pending';
      const min = Math.floor(diff / 60000);
      if (min < 1)  return 'in <1 min';
      if (min < 60) return `in ${min} min`;
      return `in ${Math.floor(min / 60)}h`;
    }

    formatDuration(ms: number): string {
      if (ms < 1000) return `${ms}ms`;
      return `${(ms / 1000).toFixed(1)}s`;
    }

    navigateToCheck(checkId: number): void {
      this.router.navigate(['/apps', this.appId, 'checks', checkId]);
    }

    navigateToAlerts(): void {
      console.log('navigateToAlerts called', this.appId);
      this.router.navigate(['/apps', this.appId], { queryParams: { tab: 'alerts' } });
    }

    acknowledge(alert: ActiveAlertDTO): void {
        this.alertService.acknowledge(alert.id, alert.group).subscribe({
          next: () => {
            this.alertRefresh.triggerRefresh();
            this.loadAlerts();
          }
        });
      }

      resolve(alert: ActiveAlertDTO): void {
        this.alertService.resolve(alert.id, alert.group).subscribe({
          next: () => {
            this.alertRefresh.triggerRefresh();  // ← add
            this.loadAlerts();
          }
        });
      }
    timeAgoValue(dateStr: string | null): string {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1)  return '<1';
    if (min < 60) return `${min}`;
    const h = Math.floor(min / 60);
    if (h < 24)   return `${h}`;
    return `${Math.floor(h / 24)}`;
  }

  timeAgoUnit(dateStr: string | null): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1)  return 'min ago';
    if (min < 60) return 'min ago';
    const h = Math.floor(min / 60);
    if (h < 24)   return 'h ago';
    return 'd ago';
  }

  timeFromNowValue(dateStr: string | null): string {
    if (!dateStr) return '—';
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff < 0) return 'Overdue';
    const min = Math.floor(diff / 60000);
    if (min < 1)  return '<1';
    if (min < 60) return `${min}`;
    return `${Math.floor(min / 60)}`;
  }

  timeFromNowUnit(dateStr: string | null): string {
    if (!dateStr) return '';
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff < 0) return '';
    const min = Math.floor(diff / 60000);
    if (min < 1)  return 'min';
    if (min < 60) return 'min';
    return 'h';
  }

  // ─── Polling ──────────────────────────────────────────
  startPolling(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      this.loadAll();
    }, 30000);
  }

  // ─── Filters ──────────────────────────────────────────
  buildFilterParams(): any {
    const params: any = {};
    if (this.filterStatus) params['status'] = this.filterStatus;
    if (this.filterType)   params['type']   = this.filterType;
    return params;
  }

  applyFilters(): void {
    this.loadStats();
    this.loadTimeline();
    this.updateUrlParams();
  }

  resetFilters(): void {
    this.filterStatus = '';
    this.filterType   = '';
    this.applyFilters();
  }

  updateUrlParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: this.filterStatus || null,
        type:   this.filterType   || null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  
}
