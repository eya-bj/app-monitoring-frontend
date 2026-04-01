import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CheckService } from '../../../core/services/check';
import { CronBuilderComponent } from '../../../shared/components/cron-builder/cron-builder';
import {
  CheckType, Severity, HealthStrategy, DbType,
  ComparisonType, FileFormat, ValidationRule,
  CreateClusterCheckRequest, CreateDataCheckRequest,
  CreateFileCheckRequest, ClusterNodeRequest, FileCheckRuleRequest,

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
  cronExpression = '';
  severity: Severity = 'HIGH';
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
  queryB = '';
  comparisonType: ComparisonType = 'NOT_ZERO';
  expectedValue: number | null = null;
  toleranceValue: number | null = null;

  // ─── File ─────────────────────────────────────────────
  sftpHost = '';
  sftpPort = 22;
  sftpUsername = '';
  sftpPassword = '';
  folderPath = '';
  fileNamePattern = '';
  expectedFormat: FileFormat = 'CSV';
  validationRules: FileCheckRuleRequest[] = [
    { rule: 'EXISTS', ruleOrder: 1 }
  ];

  // ─── Options ──────────────────────────────────────────
  severityOptions: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  dbTypeOptions: DbType[] = ['POSTGRESQL', 'MYSQL', 'ORACLE'];
  comparisonTypeOptions: ComparisonType[] = [
    'EQUALS', 'NOT_ZERO', 'EQUALS_EXPECTED',
    'SOURCE_GREATER', 'EQUALS_WITH_TOLERANCE',
  ];
  fileFormatOptions: FileFormat[] = ['CSV', 'TXT'];
  validationRuleOptions: ValidationRule[] = [
    'EXISTS', 'NOT_TEMP', 'GENERATED_AFTER', 'SIZE_MIN',
    'HEADER_MATCH', 'ROW_COUNT_MIN', 'CONTAINS_STRING',
    'COLUMN_NUMERIC', 'NO_EMPTY_COLUMN',
  ];
  rulesRequiringValue: ValidationRule[] = [
    'GENERATED_AFTER', 'SIZE_MIN', 'HEADER_MATCH',
    'ROW_COUNT_MIN', 'CONTAINS_STRING', 'COLUMN_NUMERIC',
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

  ruleRequiresValue(rule: ValidationRule): boolean {
    return this.rulesRequiringValue.includes(rule);
  }

  // ─── Validation ───────────────────────────────────────
  isCommonValid(): boolean {
    return (
      this.name.trim().length > 0 &&
      this.cronExpression.trim().length > 0
    );
  }

  isFormValid(): boolean {
    if (!this.isCommonValid()) return false;
    switch (this.selectedType()) {
      case 'CLUSTER':
        return (
          this.protocol.trim().length > 0 &&
          this.healthPath.trim().length > 0 &&
          this.nodes.every(n =>
            n.ipAddress.trim().length > 0 && n.label.trim().length > 0
          ) &&
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
          this.queryA.trim().length > 0
        );
      case 'FILE':
        return (
          this.sftpHost.trim().length > 0 &&
          this.sftpUsername.trim().length > 0 &&
          this.sftpPassword.trim().length > 0 &&
          this.folderPath.trim().length > 0 &&
          this.fileNamePattern.trim().length > 0 &&
          this.validationRules.length > 0 &&
          !this.getFileFormatError()
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
        this.router.navigate(
          ['/apps', this.appId],
          { queryParams: { tab: 'checks', action: 'created' } }
        );
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
      queryB: this.hasSecondaryDb ? this.queryB.trim() : undefined,
    };
    this.checkService.createDataCheck(this.appId, request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(
          ['/apps', this.appId],
          { queryParams: { tab: 'checks', action: 'created' } }
        );
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
      sftpPassword: this.sftpPassword.trim(),
      folderPath: this.folderPath.trim(),
      fileNamePattern: this.fileNamePattern.trim(),
      expectedFormat: this.expectedFormat,
      validationRules: this.validationRules,
    };
    this.checkService.createFileCheck(this.appId, request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(
          ['/apps', this.appId],
          { queryParams: { tab: 'checks', action: 'created' } }
        );
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Failed to create check.');
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────
  getTypeLabel(type: CheckType): string {
    const map: Record<CheckType, string> = {
      CLUSTER: 'Cluster Check',
      DATA: 'Data Check',
      FILE: 'File Check',
    };
    return map[type];
  }
getFileFormatError(): string {
  if (!this.fileNamePattern.trim()) return '';
  const pattern = this.fileNamePattern.trim().toLowerCase();
  const format = this.expectedFormat.toLowerCase();

  if (pattern.endsWith('.csv') && format !== 'csv')
    return 'File pattern ends with .csv but format is set to ' + this.expectedFormat;
  if (pattern.endsWith('.txt') && format !== 'txt')
    return 'File pattern ends with .txt but format is set to ' + this.expectedFormat;

  return '';
}
}
