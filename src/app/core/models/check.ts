export type CheckType = 'CLUSTER' | 'DATA' | 'FILE';
export type CheckStatus = 'ENABLED' | 'DISABLED';
export type Severity = 'CRITICAL' | 'WARNING' | 'INFO';
export type HealthStrategy = 'ALL_UP' | 'MAJORITY_UP';
export type DbType = 'POSTGRESQL' | 'MYSQL' | 'ORACLE';
export type ComparisonType =
  | 'EQUALS'
  | 'NOT_ZERO'
  | 'EQUALS_EXPECTED'
  | 'SOURCE_GREATER'
  | 'EQUALS_WITH_TOLERANCE';
export type FileFormat = 'CSV' | 'TXT';
export type ValidationRule =
  | 'EXISTS'
  | 'NOT_TEMP'
  | 'GENERATED_AFTER'
  | 'SIZE_MIN'
  | 'HEADER_MATCH'
  | 'ROW_COUNT_MIN'
  | 'CONTAINS_STRING'
  | 'COLUMN_NUMERIC'
  | 'NO_EMPTY_COLUMN';

export type SftpAuthMethod = 'PASSWORD' | 'SSH_KEY' ;

// ─── Response Models ──────────────────────────────────

export interface ClusterNodeResponse {
  id: number;
  ipAddress: string;
  port: number;
  label: string;
  isActive: boolean;

}

export interface ClusterCheckConfig {
  protocol: string;
  healthPath: string;
  expectedStatusCode: number;
  timeoutSeconds: number;
  authRequired: boolean;
  authUsername?: string;
  healthStrategy: HealthStrategy;
  nodes: ClusterNodeResponse[];
}

export interface DataCheckConfig {
  primaryDbType: DbType;
  primaryDbHost: string;
  primaryDbPort: number;
  primaryDbName: string;
  primaryDbUsername: string;
  queryA: string;
  secondaryDbType?: DbType;
  secondaryDbHost?: string;
  secondaryDbPort?: number;
  secondaryDbName?: string;
  secondaryDbUsername?: string;
  queryB?: string;
  comparisonType: ComparisonType;
  expectedValue?: number;
  toleranceValue?: number;
}

export interface FileCheckRuleResponse {
  id: number;
  rule: ValidationRule;
  ruleOrder: number;
  value?: string ;
}

export interface FileCheckConfig {
  sftpHost: string;
  sftpPort: number;
  sftpUsername: string;
  sftpAuthMethod: SftpAuthMethod;
  sftpPassword?: string;
  sftpPrivateKey?: string;
  folderPath: string;
  fileNamePattern: string;
  expectedFormat: FileFormat;
  validationRules: FileCheckRuleResponse[];
}

export interface CheckResponse {
  id: number;
  appId: number;
  name: string;
  description?: string;
  checkType: CheckType;
  cronExpression: string;
  severity: Severity;
  consecutiveThreshold: number;
  status: CheckStatus;
  createdAt: string;
  updatedAt: string;
  clusterConfig?: ClusterCheckConfig;
  dataConfig?: DataCheckConfig;
  fileConfig?: FileCheckConfig;
}

// ─── Request Models ───────────────────────────────────

export interface ClusterNodeRequest {
  ipAddress: string;
  port: number;
  label: string;
  isActive?: boolean;
}

export interface CreateClusterCheckRequest {
  name: string;
  description?: string;
  cronExpression: string;
  severity: Severity;
  consecutiveThreshold: number;
  protocol: string;
  healthPath: string;
  expectedStatusCode: number;
  timeoutSeconds: number;
  authRequired: boolean;
  authUsername?: string;
  authPassword?: string;
  healthStrategy: HealthStrategy;
  nodes: ClusterNodeRequest[];
}

export interface CreateDataCheckRequest {
  name: string;
  description?: string;
  cronExpression: string;
  severity: Severity;
  consecutiveThreshold: number;
  primaryDbType: DbType;
  primaryDbHost: string;
  primaryDbPort: number;
  primaryDbName: string;
  primaryDbUsername: string;
  primaryDbPassword: string;
  queryA: string;
  secondaryDbType?: DbType;
  secondaryDbHost?: string;
  secondaryDbPort?: number;
  secondaryDbName?: string;
  secondaryDbUsername?: string;
  secondaryDbPassword?: string;
  queryB?: string;
  comparisonType: ComparisonType;
  expectedValue?: number;
  toleranceValue?: number;
}

export interface FileCheckRuleRequest {
  rule: ValidationRule;
  ruleOrder: number;
  value?: string;
}

export interface CreateFileCheckRequest {
  name: string;
  description?: string;
  cronExpression: string;
  severity: Severity;
  consecutiveThreshold: number;
  sftpHost: string;
  sftpPort: number;
  sftpUsername: string;
  sftpAuthMethod: SftpAuthMethod;
  sftpPassword?: string;
  sftpPrivateKey?: string;
  folderPath: string;
  fileNamePattern: string;
  expectedFormat: FileFormat;
  validationRules: FileCheckRuleRequest[];
}

export interface UpdateClusterCheckRequest {
  name?: string;
  description?: string;
  cronExpression?: string;
  severity?: Severity;
  consecutiveThreshold?: number;
  protocol?: string;
  healthPath?: string;
  expectedStatusCode?: number;
  timeoutSeconds?: number;
  authRequired?: boolean;
  authUsername?: string;
  authPassword?: string;
  healthStrategy?: HealthStrategy;
  nodes?: ClusterNodeRequest[];
}

export interface UpdateDataCheckRequest {
  name?: string;
  description?: string;
  cronExpression?: string;
  severity?: Severity;
  consecutiveThreshold?: number;
  primaryDbType?: DbType;
  primaryDbHost?: string;
  primaryDbPort?: number;
  primaryDbName?: string;
  primaryDbUsername?: string;
  primaryDbPassword?: string;
  queryA?: string;
  secondaryDbType?: DbType;
  secondaryDbHost?: string;
  secondaryDbPort?: number;
  secondaryDbName?: string;
  secondaryDbUsername?: string;
  secondaryDbPassword?: string;
  queryB?: string;
  comparisonType?: ComparisonType;
  expectedValue?: number;
  toleranceValue?: number;
}

export interface UpdateFileCheckRequest {
  name?: string;
  description?: string;
  cronExpression?: string;
  severity?: Severity;
  consecutiveThreshold?: number;
  sftpHost?: string;
  sftpPort?: number;
  sftpAuthMethod?: SftpAuthMethod;
  sftpUsername?: string;
  sftpPassword?: string;
  sftpPrivateKey?: string;
  folderPath?: string;
  fileNamePattern?: string;
  expectedFormat?: FileFormat;
  validationRules?: FileCheckRuleRequest[];
}
