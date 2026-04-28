import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth';
import { AlertRefreshService } from '../../../core/services/alert-refresh';
import { AlertService, AlertListItemDTO } from '../../../core/services/alert';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TitleCasePipe],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss'
})
export class TopbarComponent implements OnInit, OnDestroy {
  private router       = inject(Router);
  private authService  = inject(AuthService);
  private alertService = inject(AlertService);
  private alertRefresh = inject(AlertRefreshService);

  currentUser = computed(() => this.authService.currentUser());

  bellOpen    = signal(false);
  profileOpen = signal(false);

  alerts      = signal<AlertListItemDTO[]>([]);
  unreadCount = signal(0);

  // Computed severity counts for the summary row
  criticalCount = computed(() =>
    this.alerts().filter(a => a.severity === 'CRITICAL').length);
  warningCount = computed(() =>
    this.alerts().filter(a => a.severity === 'WARNING').length);
  infoCount = computed(() =>
    this.alerts().filter(a => a.severity === 'INFO').length);

  private pollInterval: any;


  ngOnInit(): void {
    this.loadAlerts();
    this.pollInterval = setInterval(() => this.loadAlerts(), 30000);
    this.alertRefresh.refresh$.subscribe(() => this.loadAlerts());

  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }



  loadAlerts(): void {
    this.alertService.getTodayAlerts().subscribe({
      next: (alerts) => {
        this.alerts.set(alerts);
        this.unreadCount.set(alerts.length);
      },
      error: () => {}
    });
  }

  toggleBell(): void {
    this.bellOpen.update(v => !v);
    this.profileOpen.set(false);
  }

  toggleProfile(): void {
    this.profileOpen.update(v => !v);
    this.bellOpen.set(false);
  }

  closeAll(): void {
    this.bellOpen.set(false);
    this.profileOpen.set(false);
  }

  acknowledge(alertId: number, isGroup: boolean): void {
    this.alertService.acknowledge(alertId, isGroup).subscribe({
      next: () => {
        this.alertRefresh.triggerRefresh();
        this.loadAlerts();
      },
      error: () => {
        // Silently re-fetch — likely the alert was already acknowledged
        // by another action. Re-fetching shows the actual current state.
        this.loadAlerts();
      }
    });
  }

  goToAlert(alert: AlertListItemDTO): void {
    this.closeAll();
    this.router.navigate(['/apps', alert.appId], { queryParams: { tab: 'alerts' } });
  }

  goToProfile(): void {
    this.closeAll();
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.closeAll();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
}
