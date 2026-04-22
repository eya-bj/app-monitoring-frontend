import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CheckService } from '../../../core/services/check';
import { CronBuilderComponent } from '../../../shared/components/cron-builder/cron-builder';
import {
  CheckType,
  Severity,
  HealthStrategy,
  DbType,
  ComparisonType,
  FileFormat,
  ValidationRule,
  SftpAuthMethod,
  CreateClusterCheckRequest,
  CreateDataCheckRequest,
  CreateFileCheckRequest,
  ClusterNodeRequest,
  FileCheckRuleRequest,
} from '../../../core/models/check';

@Component({
  selector: 'add-check',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule, CronBuilderComponent],
  templateUrl: './add-check.html',
  styleUrl: './add-check.scss',
})
export class AddCheckComponent implements OnInit {
  step = signal<1 | 2>(1);
  selectedType = signal<CheckType | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  private appId!: number;

  // ─── Common ───────────────────────────────────────────
  name = '';
  description = '';
  cronExpression = '0 */5 * * * ?';
  severity: Severity = 'CRITICAL';
  consecutiveThreshold = 3;

  // ─── Cluster ──────────────────────────────────────────
  protocol = 'http';
  healthPath = '/actuator/health';
  expectedStatusCode = 200;
  timeoutSeconds = 10;
  authRequired = false;
  authUsername = '';
  authPassword = '';
  healthStrategy: HealthStrategy = 'ALL_UP';
  nodes: ClusterNodeRequest[] = [{ ipAddress: '', port: 8080, label: '' }];

  // ─── Data ─────────────────────────────────────────────
  primaryDbType: DbType = 'POSTGRESQL';
  primaryDbHost = '';
  primaryDbPort = 5432;
  primaryDbName = '';
  primaryDbUsername = '';
  primaryDbPassword = '';
  queryA = '';
  hasSecondaryDb = false;
  secondaryDbType: DbType = 'POSTGRESQL';
  secondaryDbHost = '';
  secondaryDbPort = 5432;
  secondaryDbName = '';
  secondaryDbUsername = '';
  secondaryDbPassword = '';
  hasQueryB = false;
  queryB = '';
  comparisonType: ComparisonType = 'NOT_ZERO';
  expectedValue: number | null = null;
  toleranceValue: number | null = null;

  // ─── File ─────────────────────────────────────────────
  sftpHost = '';
  sftpPort = 22;
  sftpUsername = '';
  sftpAuthMethod: 'PASSWORD' | 'SSH_KEY' = 'PASSWORD';
  sftpPassword = '';
  sftpPrivateKey = '';
  folderPath = '';
  fileNamePattern = '';
  expectedFormat: FileFormat = 'CSV';
  validationRules: FileCheckRuleRequest[] = [{ rule: 'EXISTS', ruleOrder: 1 }];

  // ─── Options ──────────────────────────────────────────
  severityOptions: Severity[] = ['CRITICAL' ,   'WARNING', 'INFO'];
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
    private router: Router,
    private checkService: CheckService,
  ) {}

  ngOnInit(): void {
    this.appId = Number(this.route.snapshot.paramMap.get('appId'));
  }

  // ─── Navigation ───────────────────────────────────────
  selectType(type: CheckType): void {
    this.selectedType.set(type);
    this.step.set(2);
  }

  goBack(): void {
    if (this.step() === 2) {
      this.step.set(1);
      this.errorMessage.set('');
    } else {
      this.router.navigate(['/apps', this.appId]);
    }
  }

  cancel(): void {
    this.router.navigate(['/apps', this.appId]);
  }

  // ─── Node Helpers ─────────────────────────────────────
  addNode(): void {
    this.nodes.push({ ipAddress: '', port: 8080, label: '' });
  }

  removeNode(index: number): void {
    if (this.nodes.length > 1) this.nodes.splice(index, 1);
  }

  // ─── Rule Helpers ─────────────────────────────────────
  addRule(): void {
    this.validationRules.push({
      rule: 'EXISTS',
      ruleOrder: this.validationRules.length + 1,
    });
  }

  removeRule(index: number): void {
    if (this.validationRules.length > 1) {
      this.validationRules.splice(index, 1);
      this.validationRules.forEach((r, i) => (r.ruleOrder = i + 1));
    }
  }

  // ─── Validation ───────────────────────────────────────
  isCommonValid(): boolean {
    return this.name.trim().length > 0 && this.cronExpression.trim().length > 0;
  }

  isFormValid(): boolean {
    if (!this.isCommonValid()) return false;
    switch (this.selectedType()) {
      case 'CLUSTER':
        return (
          this.protocol.trim().length > 0 &&
          this.healthPath.trim().length > 0 &&
          !this.getStatusCodeError() &&
          !this.getTimeoutError() &&
          !this.hasNodeErrors() &&
          (!this.authRequired ||
            (this.authUsername.trim().length > 0 &&
             this.authPassword.trim().length > 0))
        );
      case 'DATA':
        return (
          this.primaryDbHost.trim().length > 0 &&
          this.primaryDbName.trim().length > 0 &&
          this.primaryDbUsername.trim().length > 0 &&
          this.primaryDbPassword.trim().length > 0 &&
          !this.getQueryError(this.queryA, 'Query A') &&
          (!this.hasQueryB || !this.getQueryError(this.queryB, 'Query B'))
        );
      case 'FILE':
        return (
          this.sftpHost.trim().length > 0 &&
          this.sftpUsername.trim().length > 0 &&
          (this.sftpAuthMethod === 'PASSWORD'
            ? this.sftpPassword.trim().length > 0
            : this.sftpPrivateKey.trim().length > 0) &&
          !this.getFolderPathError() &&
          this.fileNamePattern.trim().length > 0 &&
          !this.getFileFormatError() &&
          this.validationRules.length > 0 &&
          !this.hasRuleErrors()
        );
      default:
        return false;
    }
  }

  // ─── Submit ───────────────────────────────────────────
  submit(): void {
    if (!this.isFormValid()) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    switch (this.selectedType()) {
      case 'CLUSTER': this.submitCluster(); break;
      case 'DATA':    this.submitData();    break;
      case 'FILE':    this.submitFile();    break;
    }
  }

  private submitCluster(): void {
    const request: CreateClusterCheckRequest = {
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      cronExpression: this.cronExpression.trim(),
      severity: this.severity,
      consecutiveThreshold: this.consecutiveThreshold,
      protocol: this.protocol.trim(),
      healthPath: this.healthPath.trim(),
      expectedStatusCode: this.expectedStatusCode,
      timeoutSeconds: this.timeoutSeconds,
      authRequired: this.authRequired,
      authUsername: this.authRequired ? this.authUsername : undefined,
      authPassword: this.authRequired ? this.authPassword : undefined,
      healthStrategy: this.healthStrategy,
      nodes: this.nodes,
    };
    this.checkService.createClusterCheck(this.appId, request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/apps', this.appId], {
          queryParams: { tab: 'checks', action: 'created' },
        });
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Failed to create check.');
      },
    });
  }

  private submitData(): void {
    const request: CreateDataCheckRequest = {
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      cronExpression: this.cronExpression.trim(),
      severity: this.severity,
      consecutiveThreshold: this.consecutiveThreshold,
      primaryDbType: this.primaryDbType,
      primaryDbHost: this.primaryDbHost.trim(),
      primaryDbPort: this.primaryDbPort,
      primaryDbName: this.primaryDbName.trim(),
      primaryDbUsername: this.primaryDbUsername.trim(),
      primaryDbPassword: this.primaryDbPassword.trim(),
      queryA: this.queryA.trim(),
      comparisonType: this.comparisonType,
      expectedValue: this.expectedValue ?? undefined,
      toleranceValue: this.toleranceValue ?? undefined,
      secondaryDbType: this.hasSecondaryDb ? this.secondaryDbType : undefined,
      secondaryDbHost: this.hasSecondaryDb ? this.secondaryDbHost.trim() : undefined,
      secondaryDbPort: this.hasSecondaryDb ? this.secondaryDbPort : undefined,
      secondaryDbName: this.hasSecondaryDb ? this.secondaryDbName.trim() : undefined,
      secondaryDbUsername: this.hasSecondaryDb ? this.secondaryDbUsername.trim() : undefined,
      secondaryDbPassword: this.hasSecondaryDb ? this.secondaryDbPassword.trim() : undefined,
      queryB: this.hasQueryB ? this.queryB.trim() : undefined,
    };
    this.checkService.createDataCheck(this.appId, request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/apps', this.appId], {
          queryParams: { tab: 'checks', action: 'created' },
        });
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Failed to create check.');
      },
    });
  }

  private submitFile(): void {
    const request: CreateFileCheckRequest = {
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      cronExpression: this.cronExpression.trim(),
      severity: this.severity,
      consecutiveThreshold: this.consecutiveThreshold,
      sftpHost: this.sftpHost.trim(),
      sftpPort: this.sftpPort,
      sftpUsername: this.sftpUsername.trim(),
      sftpAuthMethod: this.sftpAuthMethod,
      sftpPassword: this.sftpAuthMethod === 'PASSWORD'
        ? this.sftpPassword.trim() : undefined,
      sftpPrivateKey: this.sftpAuthMethod === 'SSH_KEY'
        ? this.sftpPrivateKey.trim() : undefined,
      folderPath: this.folderPath.trim(),
      fileNamePattern: this.fileNamePattern.trim(),
      expectedFormat: this.expectedFormat,
      validationRules: this.validationRules,
    };
    this.checkService.createFileCheck(this.appId, request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/apps', this.appId], {
          queryParams: { tab: 'checks', action: 'created' },
        });
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Failed to create check.');
      },
    });
  }

  // ─── Cluster Validation Helpers ───────────────────────
  getStatusCodeError(): string {
    if (!this.expectedStatusCode) return 'Status code is required';
    if (this.expectedStatusCode < 100 || this.expectedStatusCode > 599)
      return 'Status code must be between 100 and 599';
    return '';
  }

  getTimeoutError(): string {
    if (!this.timeoutSeconds) return 'Timeout is required';
    if (this.timeoutSeconds < 1 || this.timeoutSeconds > 60)
      return 'Timeout must be between 1 and 60 seconds';
    return '';
  }

  getNodePortError(port: number): string {
    if (!port) return 'Port is required';
    if (port < 1 || port > 65535) return 'Port must be between 1 and 65535';
    return '';
  }

  hasNodeErrors(): boolean {
    return this.nodes.some(n =>
      !n.ipAddress.trim() ||
      !n.label.trim() ||
      !!this.getNodePortError(n.port)
    );
  }

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
    if (!this.folderPath.trim()) return 'Folder path is required';
    if (!this.folderPath.trim().startsWith('/'))
      return 'Folder path must start with /';
    return '';
  }

  getFileFormatError(): string {
    if (!this.fileNamePattern.trim()) return '';
    const pattern = this.fileNamePattern.trim().toLowerCase();
    const format = this.expectedFormat.toLowerCase();
    const dotIndex = pattern.lastIndexOf('.');
    if (dotIndex !== -1) {
      const ext = pattern.substring(dotIndex + 1).replace('*', '').trim();
      if (ext && ext !== 'csv' && ext !== 'txt')
        return 'File pattern must have a .csv or .txt extension';
      if (ext === 'csv' && format !== 'csv')
        return 'File pattern ends with .csv but format is set to ' + this.expectedFormat;
      if (ext === 'txt' && format !== 'txt')
        return 'File pattern ends with .txt but format is set to ' + this.expectedFormat;
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
    return this.validationRules.some(r =>
      !!this.getRuleValueError(r.rule, r.value)
    );
  }

  // ─── Comparison Type Helper ───────────────────────────
  get filteredComparisonTypes(): ComparisonType[] {
    const isSingleValueMode = !this.hasSecondaryDb && !this.hasQueryB;
    return isSingleValueMode
      ? ['NOT_ZERO', 'EQUALS_EXPECTED']
      : ['EQUALS', 'SOURCE_GREATER', 'EQUALS_WITH_TOLERANCE'];
  }

  onModeChange(): void {
    const valid = this.filteredComparisonTypes;
    if (!valid.includes(this.comparisonType)) {
      this.comparisonType = valid[0];
    }
  }

  // ─── Display Helpers ──────────────────────────────────
  getTypeLabel(type: CheckType): string {
    const map: Record<CheckType, string> = {
      CLUSTER: 'Cluster Check',
      DATA: 'Data Check',
      FILE: 'File Check',
    };
    return map[type];
  }
}
