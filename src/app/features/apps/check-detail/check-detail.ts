import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CheckService } from '../../../core/services/check';
import { AuthService } from '../../../core/services/auth';
import { CheckResultService } from '../../../core/services/check-result';
import { CheckResultResponse } from '../../../core/models/check-result';
import { CronBuilderComponent } from '../../../shared/components/cron-builder/cron-builder';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SuccessDialogComponent } from '../../../shared/components/success-dialog/success-dialog';
import { CronHumanPipe } from '../../../shared/pipes/cron-human-pipe';
import {
  CheckResponse,
  Severity,
  HealthStrategy,
  DbType,
  ComparisonType,
  FileFormat,
  ValidationRule,
  SftpAuthMethod,
  UpdateClusterCheckRequest,
  UpdateDataCheckRequest,
  UpdateFileCheckRequest,
  ClusterNodeRequest,
  FileCheckRuleRequest,
} from '../../../core/models/check';

@Component({
  selector: 'check-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    CronBuilderComponent,
    CronHumanPipe,
  ],
  templateUrl: './check-detail.html',
  styleUrl: './check-detail.scss',
})
export class CheckDetailComponent implements OnInit {
  check = signal<CheckResponse | null>(null);
  isLoading = signal(true);
  isEditing = signal(false);
  isSaving = signal(false);
  errorMessage = signal('');
  recentResults = signal<CheckResultResponse[]>([]);
  resultsLoading = signal(false);

  private appId!: number;
  private checkId!: number;

  currentUser = computed(() => this.authService.currentUser());
  isAdmin = computed(
    () => this.currentUser()?.role === 'ADMIN' || this.currentUser()?.role === 'SYSTEM_ADMIN',
  );

  // ─── Edit Fields — Common ─────────────────────────────
  editName = '';
  editDescription = '';
  editCronExpression = '0 */5 * * * ?';
  editSeverity: Severity = 'CRITICAL';
  editConsecutiveThreshold = 3;

  // ─── Edit Fields — Cluster ────────────────────────────
  editProtocol = 'http';
  editHealthPath = '/actuator/health';
  editExpectedStatusCode = 200;
  editTimeoutSeconds = 10;
  editAuthRequired = false;
  editAuthUsername = '';
  editAuthPassword = '';
  editHealthStrategy: HealthStrategy = 'ALL_UP';
  editNodes: ClusterNodeRequest[] = [];

  // ─── Edit Fields — Data ───────────────────────────────
  editPrimaryDbType: DbType = 'POSTGRESQL';
  editPrimaryDbHost = '';
  editPrimaryDbPort = 5432;
  editPrimaryDbName = '';
  editPrimaryDbUsername = '';
  editPrimaryDbPassword = '';
  editQueryA = '';
  editHasSecondaryDb = false;
  editSecondaryDbType: DbType = 'POSTGRESQL';
  editSecondaryDbHost = '';
  editSecondaryDbPort = 5432;
  editSecondaryDbName = '';
  editSecondaryDbUsername = '';
  editSecondaryDbPassword = '';
  editHasQueryB = false;
  editQueryB = '';
  editComparisonType: ComparisonType = 'NOT_ZERO';
  editExpectedValue: number | null = null;
  editToleranceValue: number | null = null;

  // ─── Edit Fields — File ───────────────────────────────
  editSftpHost = '';
  editSftpPort = 22;
  editSftpUsername = '';
  editSftpAuthMethod: 'PASSWORD' | 'SSH_KEY' = 'PASSWORD';
  editSftpPassword = '';
  editSftpPrivateKey = '';
  editFolderPath = '';
  editFileNamePattern = '';
  editExpectedFormat: FileFormat = 'CSV';
  editValidationRules: FileCheckRuleRequest[] = [];

  // ─── Options ──────────────────────────────────────────
  severityOptions: Severity[] = ['CRITICAL', 'WARNING', 'INFO'];
  dbTypeOptions: DbType[] = ['POSTGRESQL', 'MYSQL', 'ORACLE'];
  fileFormatOptions: FileFormat[] = ['CSV', 'TXT'];
  authMethodOptions: SftpAuthMethod[] = ['PASSWORD', 'SSH_KEY'];
  validationRuleOptions: ValidationRule[] = [
    'EXISTS', 'NOT_TEMP', 'GENERATED_AFTER', 'SIZE_MIN',
    'HEADER_MATCH', 'ROW_COUNT_MIN', 'CONTAINS_STRING',
    'COLUMN_NUMERIC', 'NO_EMPTY_COLUMN',
  ];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private checkService: CheckService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private checkResultService: CheckResultService,
  ) {}

  ngOnInit(): void {
    this.appId = Number(this.route.snapshot.paramMap.get('appId'));
    this.checkId = Number(this.route.snapshot.paramMap.get('checkId'));
    this.loadCheck();
  }

  // ─── Load ─────────────────────────────────────────────
  loadCheck(): void {
    this.isLoading.set(true);
    this.checkService.getCheckById(this.checkId).subscribe({
      next: (check) => {
        this.check.set(check);
        this.isLoading.set(false);
        this.loadRecentResults();
      },
      error: () => {
        this.errorMessage.set('Failed to load check.');
        this.isLoading.set(false);
      },
    });
  }

  loadRecentResults(): void {
    this.resultsLoading.set(true);
    this.checkResultService.getRecentResults(this.checkId, 5).subscribe({
      next: (results) => {
        this.recentResults.set(results);
        this.resultsLoading.set(false);
      },
      error: () => this.resultsLoading.set(false),
    });
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  getResultStatusClass(status: string): string {
    return status === 'PASSED' ? 'badge badge-passed' : 'badge badge-failed';
  }
  goToApps(): void {
    this.router.navigate(['/apps']);
  }

  goBack(): void {
    this.router.navigate(['/apps', this.appId], { queryParams: { tab: 'checks' } });
  }

  // ─── Edit Mode ────────────────────────────────────────
  startEdit(): void {
    const c = this.check();
    if (!c) return;

    this.editName = c.name;
    this.editDescription = c.description ?? '';
    this.editCronExpression = c.cronExpression;
    this.editSeverity = c.severity;
    this.editConsecutiveThreshold = c.consecutiveThreshold;

    if (c.checkType === 'CLUSTER' && c.clusterConfig) {
      this.editProtocol = c.clusterConfig.protocol;
      this.editHealthPath = c.clusterConfig.healthPath;
      this.editExpectedStatusCode = c.clusterConfig.expectedStatusCode;
      this.editTimeoutSeconds = c.clusterConfig.timeoutSeconds;
      this.editAuthRequired = c.clusterConfig.authRequired;
      this.editAuthUsername = c.clusterConfig.authUsername ?? '';
      this.editHealthStrategy = c.clusterConfig.healthStrategy;
      this.editNodes = c.clusterConfig.nodes.map((n) => ({
        ipAddress: n.ipAddress,
        port: n.port,
        label: n.label,
        isActive: n.isActive ?? true,
      }));
    }

    if (c.checkType === 'DATA' && c.dataConfig) {
      this.editPrimaryDbType = c.dataConfig.primaryDbType;
      this.editPrimaryDbHost = c.dataConfig.primaryDbHost;
      this.editPrimaryDbPort = c.dataConfig.primaryDbPort;
      this.editPrimaryDbName = c.dataConfig.primaryDbName;
      this.editPrimaryDbUsername = c.dataConfig.primaryDbUsername;
      this.editQueryA = c.dataConfig.queryA;
      this.editComparisonType = c.dataConfig.comparisonType;
      this.editExpectedValue = c.dataConfig.expectedValue ?? null;
      this.editToleranceValue = c.dataConfig.toleranceValue ?? null;
      this.editHasSecondaryDb = !!c.dataConfig.secondaryDbHost;
      this.editHasQueryB = !!c.dataConfig.queryB;
      this.editQueryB = c.dataConfig.queryB ?? '';
      if (this.editHasSecondaryDb) {
        this.editSecondaryDbType = c.dataConfig.secondaryDbType!;
        this.editSecondaryDbHost = c.dataConfig.secondaryDbHost!;
        this.editSecondaryDbPort = c.dataConfig.secondaryDbPort!;
        this.editSecondaryDbName = c.dataConfig.secondaryDbName!;
        this.editSecondaryDbUsername = c.dataConfig.secondaryDbUsername!;
      }
    }

    if (c.checkType === 'FILE' && c.fileConfig) {
      this.editSftpHost = c.fileConfig.sftpHost;
      this.editSftpPort = c.fileConfig.sftpPort;
      this.editSftpUsername = c.fileConfig.sftpUsername;
      this.editSftpAuthMethod = c.fileConfig.sftpAuthMethod || 'PASSWORD';
      this.editSftpPassword = c.fileConfig.sftpPassword || '';
      this.editSftpPrivateKey = c.fileConfig.sftpPrivateKey || '';
      this.editFolderPath = c.fileConfig.folderPath;
      this.editFileNamePattern = c.fileConfig.fileNamePattern;
      this.editExpectedFormat = c.fileConfig.expectedFormat;
      this.editValidationRules = c.fileConfig.validationRules.map((r) => ({
        rule: r.rule,
        ruleOrder: r.ruleOrder,
        value: r.value,
      }));
    }

    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.errorMessage.set('');
  }

  saveEdit(): void {
    const c = this.check();
    if (!c) return;
    this.isSaving.set(true);
    this.errorMessage.set('');
    switch (c.checkType) {
      case 'CLUSTER': this.saveCluster(); break;
      case 'DATA':    this.saveData();    break;
      case 'FILE':    this.saveFile();    break;
    }
  }

  private saveCluster(): void {
    const request: UpdateClusterCheckRequest = {
      name: this.editName.trim(),
      description: this.editDescription.trim() || undefined,
      cronExpression: this.editCronExpression,
      severity: this.editSeverity,
      consecutiveThreshold: this.editConsecutiveThreshold,
      protocol: this.editProtocol,
      healthPath: this.editHealthPath,
      expectedStatusCode: this.editExpectedStatusCode,
      timeoutSeconds: this.editTimeoutSeconds,
      authRequired: this.editAuthRequired,
      authUsername: this.editAuthRequired ? this.editAuthUsername : undefined,
      authPassword: this.editAuthPassword.trim() || undefined,
      healthStrategy: this.editHealthStrategy,
      nodes: this.editNodes,
    };
    this.checkService.updateClusterCheck(this.checkId, request).subscribe({
      next: (updated) => {
        this.check.set(updated);
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.showSuccess('Check Updated', 'Check has been updated successfully.');
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Failed to update check.');
      },
    });
  }

  private saveData(): void {
    const queryAError = this.getQueryError(this.editQueryA, 'Query A');
    if (queryAError) {
      this.errorMessage.set(queryAError);
      this.isSaving.set(false);
      return;
    }
    const request: UpdateDataCheckRequest = {
      name: this.editName.trim(),
      description: this.editDescription.trim() || undefined,
      cronExpression: this.editCronExpression,
      severity: this.editSeverity,
      consecutiveThreshold: this.editConsecutiveThreshold,
      primaryDbType: this.editPrimaryDbType,
      primaryDbHost: this.editPrimaryDbHost,
      primaryDbPort: this.editPrimaryDbPort,
      primaryDbName: this.editPrimaryDbName,
      primaryDbUsername: this.editPrimaryDbUsername,
      primaryDbPassword: this.editPrimaryDbPassword.trim() || undefined,
      queryA: this.editQueryA,
      comparisonType: this.editComparisonType,
      expectedValue: this.editExpectedValue ?? undefined,
      toleranceValue: this.editToleranceValue ?? undefined,
      secondaryDbType: this.editHasSecondaryDb ? this.editSecondaryDbType : undefined,
      secondaryDbHost: this.editHasSecondaryDb ? this.editSecondaryDbHost : undefined,
      secondaryDbPort: this.editHasSecondaryDb ? this.editSecondaryDbPort : undefined,
      secondaryDbName: this.editHasSecondaryDb ? this.editSecondaryDbName : undefined,
      secondaryDbUsername: this.editHasSecondaryDb ? this.editSecondaryDbUsername : undefined,
      secondaryDbPassword: this.editHasSecondaryDb && this.editSecondaryDbPassword.trim()
        ? this.editSecondaryDbPassword : undefined,
      queryB: this.editHasQueryB ? this.editQueryB : undefined,
    };
    this.checkService.updateDataCheck(this.checkId, request).subscribe({
      next: (updated) => {
        this.check.set(updated);
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.showSuccess('Check Updated', 'Check has been updated successfully.');
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Failed to update check.');
      },
    });
  }

  private saveFile(): void {
    if (this.hasRuleErrors()) {
      this.errorMessage.set('Please fix validation rule errors before saving.');
      this.isSaving.set(false);
      return;
    }
    const formatError = this.getFileFormatError();
    if (formatError) {
      this.errorMessage.set(formatError);
      this.isSaving.set(false);
      return;
    }
    const folderError = this.getFolderPathError();
    if (folderError) {
      this.errorMessage.set(folderError);
      this.isSaving.set(false);
      return;
    }
    this.errorMessage.set('');
    const request: UpdateFileCheckRequest = {
      name: this.editName.trim(),
      description: this.editDescription.trim() || undefined,
      cronExpression: this.editCronExpression,
      severity: this.editSeverity,
      consecutiveThreshold: this.editConsecutiveThreshold,
      sftpHost: this.editSftpHost,
      sftpPort: this.editSftpPort,
      sftpUsername: this.editSftpUsername,
      sftpAuthMethod: this.editSftpAuthMethod,
      sftpPassword: this.editSftpAuthMethod === 'PASSWORD'
        ? this.editSftpPassword.trim() || undefined : undefined,
      sftpPrivateKey: this.editSftpAuthMethod === 'SSH_KEY'
        ? this.editSftpPrivateKey.trim() || undefined : undefined,
      folderPath: this.editFolderPath,
      fileNamePattern: this.editFileNamePattern,
      expectedFormat: this.editExpectedFormat,
      validationRules: this.editValidationRules,
    };
    this.checkService.updateFileCheck(this.checkId, request).subscribe({
      next: (updated) => {
        this.check.set(updated);
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.showSuccess('Check Updated', 'Check has been updated successfully.');
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Failed to update check.');
      },
    });
  }

  // ─── Node Helpers ─────────────────────────────────────
  addNode(): void {
    this.editNodes.push({ ipAddress: '', port: 8080, label: '', isActive: true });
  }

  removeNode(index: number): void {
    if (this.editNodes.length <= 1) return;
    const node = this.editNodes[index];
    const ref = this.dialog.open(ConfirmDialogComponent, {
      position: { top: '80px' },
      data: {
        title: 'Delete Node',
        message: `Are you sure you want to delete "${node.label || 'this node'}"? This will permanently remove the node and its execution history.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        isDanger: true,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.editNodes.splice(index, 1);
    });
  }

  // ─── Rule Helpers ─────────────────────────────────────
  addRule(): void {
    this.editValidationRules.push({
      rule: 'EXISTS',
      ruleOrder: this.editValidationRules.length + 1,
    });
  }

  removeRule(index: number): void {
    if (this.editValidationRules.length > 1) {
      this.editValidationRules.splice(index, 1);
      this.editValidationRules.forEach((r, i) => (r.ruleOrder = i + 1));
    }
  }

  // ─── Toggle / Delete ──────────────────────────────────
  toggleCheck(): void {
    const c = this.check();
    if (!c) return;
    const action = c.status === 'ENABLED'
      ? this.checkService.disableCheck(c.id)
      : this.checkService.enableCheck(c.id);
    action.subscribe({
      next: (updated) => this.check.set(updated),
      error: (err: any) => {
        this.snackBar.open(err?.error?.message || 'Failed to update status.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  deleteCheck(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      position: { top: '80px' },
      data: {
        title: 'Delete Check',
        message: `Are you sure you want to delete "${this.check()?.name}"?`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        isDanger: true,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.checkService.deleteCheck(this.checkId).subscribe({
        next: () => {
          this.router.navigate(['/apps', this.appId], {
            queryParams: { tab: 'checks', action: 'deleted' },
          });
        },
        error: (err: any) => {
          this.snackBar.open(err?.error?.message || 'Failed to delete check.', 'Close', {
            duration: 3000,
          });
        },
      });
    });
  }

  // ─── Cluster Validation Helpers ───────────────────────
  getEditStatusCodeError(): string {
    if (!this.editExpectedStatusCode) return 'Status code is required';
    if (this.editExpectedStatusCode < 100 || this.editExpectedStatusCode > 599)
      return 'Status code must be between 100 and 599';
    return '';
  }

  getEditTimeoutError(): string {
    if (!this.editTimeoutSeconds) return 'Timeout is required';
    if (this.editTimeoutSeconds < 1 || this.editTimeoutSeconds > 60)
      return 'Timeout must be between 1 and 60 seconds';
    return '';
  }

  getNodePortError(port: number): string {
    if (!port) return 'Port is required';
    if (port < 1 || port > 65535) return 'Port must be between 1 and 65535';
    return '';
  }

  // ─── Data Validation Helpers ──────────────────────────
  getQueryError(query: string, fieldName: string): string {
    if (!query.trim()) return fieldName + ' is required';
    const upper = query.trim().toUpperCase();
    const dangerous = ['DROP', 'DELETE', 'UPDATE', 'INSERT',
                       'TRUNCATE', 'ALTER', 'CREATE'];
    for (const keyword of dangerous) {
      const regex = new RegExp('\\b' + keyword + '\\b');
      if (regex.test(upper))
        return fieldName + ' must be a read-only SELECT query — "'
          + keyword + '" is not allowed';
    }
    return '';
  }

  // ─── File Validation Helpers ──────────────────────────
  getFolderPathError(): string {
    if (!this.editFolderPath.trim()) return 'Folder path is required';
    if (!this.editFolderPath.trim().startsWith('/'))
      return 'Folder path must start with /';
    return '';
  }

  getFileFormatError(): string {
    if (!this.editFileNamePattern.trim()) return '';
    const pattern = this.editFileNamePattern.trim().toLowerCase();
    const format = this.editExpectedFormat.toLowerCase();
    const dotIndex = pattern.lastIndexOf('.');
    if (dotIndex !== -1) {
      const ext = pattern.substring(dotIndex + 1).replace('*', '').trim();
      if (ext && ext !== 'csv' && ext !== 'txt')
        return 'File pattern must have a .csv or .txt extension';
      if (ext === 'csv' && format !== 'csv')
        return 'File pattern ends with .csv but format is set to ' + this.editExpectedFormat;
      if (ext === 'txt' && format !== 'txt')
        return 'File pattern ends with .txt but format is set to ' + this.editExpectedFormat;
    }
    return '';
  }

  ruleRequiresValue(rule: string): boolean {
    return ['GENERATED_AFTER', 'SIZE_MIN', 'HEADER_MATCH',
            'ROW_COUNT_MIN', 'CONTAINS_STRING',
            'COLUMN_NUMERIC', 'NO_EMPTY_COLUMN'].includes(rule);
  }

  getRuleValueError(rule: string, value: string | undefined): string {
    if (!this.ruleRequiresValue(rule)) return '';
    if (!value || !value.trim()) return 'Value is required for this rule';
    switch (rule) {
      case 'GENERATED_AFTER':
        return /^\d{2}:\d{2}$/.test(value.trim())
          ? '' : 'Must be a valid time (HH:mm), e.g. 08:00';
      case 'SIZE_MIN':
        return /^\d+$/.test(value.trim()) && parseInt(value) >= 0
          ? '' : 'Must be a positive number (bytes)';
      case 'ROW_COUNT_MIN':
        return /^\d+$/.test(value.trim()) && parseInt(value) >= 1
          ? '' : 'Must be a number >= 1';
      case 'COLUMN_NUMERIC':
      case 'NO_EMPTY_COLUMN':
        return /^\d+$/.test(value.trim()) && parseInt(value) >= 0
          ? '' : 'Must be a column index >= 0';
      case 'HEADER_MATCH':
      case 'CONTAINS_STRING':
        return value.trim().length > 0 ? '' : 'Value is required';
      default:
        return '';
    }
  }

  hasRuleErrors(): boolean {
    return this.editValidationRules.some(r =>
      !!this.getRuleValueError(r.rule, r.value ?? '')
    );
  }

  // ─── Comparison Type Helper ───────────────────────────
  get editFilteredComparisonTypes(): ComparisonType[] {
    const isSingleValueMode = !this.editHasSecondaryDb && !this.editHasQueryB;
    return isSingleValueMode
      ? ['NOT_ZERO', 'EQUALS_EXPECTED']
      : ['EQUALS', 'SOURCE_GREATER', 'EQUALS_WITH_TOLERANCE'];
  }

  onEditModeChange(): void {
    const valid = this.editFilteredComparisonTypes;
    if (!valid.includes(this.editComparisonType)) {
      this.editComparisonType = valid[0];
    }
  }

  // ─── Badge / Display Helpers ──────────────────────────
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

  getSeverityBadgeClass(severity: string): string {
    const map: Record<string, string> = {
      INFO:     'badge badge-info',
      WARNING:  'badge badge-warning',
      CRITICAL: 'badge badge-critical',
    };
    return map[severity] ?? 'badge';
  }

  getStatusClass(status: string): string {
    return status === 'ENABLED'
      ? 'status-badge status-enabled'
      : 'status-badge status-disabled';
  }

  private showSuccess(title: string, message: string): void {
    this.dialog.open(SuccessDialogComponent, {
      position: { top: '80px' },
      data: { title, message },
    });
  }
}
