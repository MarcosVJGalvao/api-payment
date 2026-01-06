import { AuditLog } from '../../entities/audit-log.entity';
import { AuditAction } from '../../enums/audit-action.enum';
import { AuditLogStatus } from '../../enums/audit-log-status.enum';

export interface AlertThreshold {
  loginFailure: number;
  massDeletion: number;
  unauthorizedAccess: number;
  passwordChange: number;
  unusualActivity: number;
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThreshold = {
  loginFailure: 5,
  massDeletion: 10,
  unauthorizedAccess: 3,
  passwordChange: 5,
  unusualActivity: 50,
};

export function detectLoginFailuresByIp(
  logs: AuditLog[],
  threshold: number = DEFAULT_ALERT_THRESHOLDS.loginFailure,
): Record<string, number> {
  const failuresByIp: Record<string, number> = {};

  for (const log of logs) {
    if (log.action === AuditAction.USER_LOGIN_FAILED && log.ipAddress) {
      failuresByIp[log.ipAddress] = (failuresByIp[log.ipAddress] || 0) + 1;
    }
  }

  const alerts: Record<string, number> = {};
  for (const [ip, count] of Object.entries(failuresByIp)) {
    if (count >= threshold) {
      alerts[ip] = count;
    }
  }

  return alerts;
}

export function detectLoginFailuresByUsername(
  logs: AuditLog[],
  threshold: number = DEFAULT_ALERT_THRESHOLDS.loginFailure,
): Record<string, number> {
  const failuresByUsername: Record<string, number> = {};

  for (const log of logs) {
    if (log.action === AuditAction.USER_LOGIN_FAILED && log.username) {
      failuresByUsername[log.username] =
        (failuresByUsername[log.username] || 0) + 1;
    }
  }

  const alerts: Record<string, number> = {};
  for (const [username, count] of Object.entries(failuresByUsername)) {
    if (count >= threshold) {
      alerts[username] = count;
    }
  }

  return alerts;
}

export function detectMassDeletions(
  logs: AuditLog[],
  threshold: number = DEFAULT_ALERT_THRESHOLDS.massDeletion,
): Record<string, number> {
  const deletionsByUser: Record<string, number> = {};

  for (const log of logs) {
    if (log.action === AuditAction.USER_DELETED && log.userId) {
      deletionsByUser[log.userId] = (deletionsByUser[log.userId] || 0) + 1;
    }
  }

  const alerts: Record<string, number> = {};
  for (const [userId, count] of Object.entries(deletionsByUser)) {
    if (count >= threshold) {
      alerts[userId] = count;
    }
  }

  return alerts;
}

export function detectUnauthorizedAccess(
  logs: AuditLog[],
  threshold: number = DEFAULT_ALERT_THRESHOLDS.unauthorizedAccess,
): {
  byIp: Record<string, number>;
  byUser: Record<string, number>;
} {
  const unauthorizedLogs = logs.filter((log) => {
    if (log.status !== AuditLogStatus.FAILURE || !log.errorMessage) {
      return false;
    }
    const errorMessage = log.errorMessage.toLowerCase();
    return (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('permission denied')
    );
  });

  const accessesByIp: Record<string, number> = {};
  const accessesByUser: Record<string, number> = {};

  for (const log of unauthorizedLogs) {
    if (log.ipAddress) {
      accessesByIp[log.ipAddress] = (accessesByIp[log.ipAddress] || 0) + 1;
    }
    if (log.userId) {
      accessesByUser[log.userId] = (accessesByUser[log.userId] || 0) + 1;
    }
  }

  const alertsByIp: Record<string, number> = {};
  const alertsByUser: Record<string, number> = {};

  for (const [ip, count] of Object.entries(accessesByIp)) {
    if (count >= threshold) {
      alertsByIp[ip] = count;
    }
  }

  for (const [userId, count] of Object.entries(accessesByUser)) {
    if (count >= threshold) {
      alertsByUser[userId] = count;
    }
  }

  return { byIp: alertsByIp, byUser: alertsByUser };
}

export function detectPasswordChangeAbuse(
  logs: AuditLog[],
  threshold: number = DEFAULT_ALERT_THRESHOLDS.passwordChange,
): Record<string, number> {
  const changesByUser: Record<string, number> = {};

  for (const log of logs) {
    if (log.action === AuditAction.USER_PASSWORD_CHANGED && log.userId) {
      changesByUser[log.userId] = (changesByUser[log.userId] || 0) + 1;
    }
  }

  const alerts: Record<string, number> = {};
  for (const [userId, count] of Object.entries(changesByUser)) {
    if (count >= threshold) {
      alerts[userId] = count;
    }
  }

  return alerts;
}

export function detectUnusualActivity(
  logs: AuditLog[],
  threshold: number = DEFAULT_ALERT_THRESHOLDS.unusualActivity,
): Record<
  string,
  { totalActions: number; actionsBreakdown: Record<string, number> }
> {
  const actionsByUser: Record<string, Record<string, number>> = {};

  for (const log of logs) {
    if (!log.userId) continue;

    if (!actionsByUser[log.userId]) {
      actionsByUser[log.userId] = {};
    }

    actionsByUser[log.userId][log.action] =
      (actionsByUser[log.userId][log.action] || 0) + 1;
  }

  const alerts: Record<
    string,
    { totalActions: number; actionsBreakdown: Record<string, number> }
  > = {};

  for (const [userId, actions] of Object.entries(actionsByUser)) {
    const totalActions = Object.values(actions).reduce(
      (sum, count) => sum + count,
      0,
    );

    if (totalActions >= threshold) {
      alerts[userId] = {
        totalActions,
        actionsBreakdown: actions,
      };
    }
  }

  return alerts;
}
