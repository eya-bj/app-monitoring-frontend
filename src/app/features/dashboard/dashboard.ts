import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {
  GlobalDashboardService,
  GlobalDashboardResponse,
  CriticalAlertDTO
} from '../../core/services/global-dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private svc    = inject(GlobalDashboardService);
  private router = inject(Router);

  dashboard      = signal<GlobalDashboardResponse | null>(null);
  criticalAlerts = signal<CriticalAlertDTO[]>([]);
  loading        = signal(true);
  private initialLoad  = true;
  private pollInterval: any;

  ngOnInit(): void {
    this.loadAll();
    this.pollInterval = setInterval(() => this.loadAll(), 30000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadAll(): void {
    if (this.initialLoad) this.loading.set(true);

    this.svc.getGlobalDashboard().subscribe({
      next: (d) => {
        this.dashboard.set(d);
        this.loading.set(false);
        this.initialLoad = false;
      },
      error: () => {
        this.loading.set(false);
        this.initialLoad = false;
      }
    });

    this.svc.getCriticalAlerts().subscribe({
      next: (a) => this.criticalAlerts.set(a)
    });
  }

  getDotClass(status: string): string {
    const map: Record<string, string> = {
      HEALTHY:  'dot-healthy',
      WARNING:  'dot-warning',
      CRITICAL: 'dot-critical',
      UNKNOWN:  'dot-unknown'
    };
    return map[status] ?? 'dot-unknown';
  }

  getScoreClass(status: string): string {
    const map: Record<string, string> = {
      HEALTHY:  'score-healthy',
      WARNING:  'score-warning',
      CRITICAL: 'score-critical',
      UNKNOWN:  'score-unknown'
    };
    return map[status] ?? 'score-unknown';
  }

  timeAgo(iso: string | null): string {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  lastCheckTime(iso: string | null): string {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  goToApp(appId: number): void {
    this.router.navigate(['/apps', appId], { queryParams: { tab: 'dashboard' } });
  }

  goToAlerts(appId: number): void {
    this.router.navigate(['/apps', appId], { queryParams: { tab: 'alerts' } });
  }
}