import { CheckType } from './check';

export type ResultStatus = 'PASSED' | 'FAILED';

export interface NodeResultResponse {
  label: string;
  ipAddress: string;
  port: number;
  status: ResultStatus;
  durationMs: number;
  httpStatusCode?: number;
  errorMessage?: string;
}

export interface CheckResultResponse {
  id: number;
  status: ResultStatus;
  executedAt: string;
  durationMs: number;
  errorMessage?: string;
  details?: string;
  checkType: CheckType;
  checkName: string;
  nodeResults: NodeResultResponse[];
}
