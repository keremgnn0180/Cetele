export type IpcResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type HealthCheckItem = {
  ok: boolean;
  message?: string;
};

export type HealthCheckReport = {
  ok: boolean;
  checkedAt: string;
  checks: Record<string, HealthCheckItem>;
};
