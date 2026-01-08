export class SanitizeDataHelper {
  private static readonly maxDepth: number = 20;
  private static sensitiveFieldsCache: Set<string> | null = null;

  private static getSensitiveFields(): Set<string> {
    if (this.sensitiveFieldsCache === null) {
      const envFields =
        process.env.SENSITIVE_FIELDS?.split(',').map((f) => f.trim()) || [];
      const fields = envFields.length > 0 ? envFields : ['password'];
      this.sensitiveFieldsCache = new Set(
        fields.map((field) => field.toLowerCase()),
      );
    }
    return this.sensitiveFieldsCache;
  }

  static sanitize(data: unknown, depth: number = 0): unknown {
    if (depth > this.maxDepth) {
      return data;
    }

    if (data === null || data === undefined) {
      return data;
    }

    if (
      typeof data !== 'object' ||
      data instanceof Date ||
      data instanceof RegExp ||
      data instanceof Buffer ||
      data instanceof Error
    ) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item, depth + 1));
    }

    if (data instanceof Map) {
      const sanitizedMap = new Map();
      for (const [key, value] of data.entries()) {
        sanitizedMap.set(key, this.sanitize(value, depth + 1));
      }
      return sanitizedMap;
    }

    if (data instanceof Set) {
      const sanitizedSet = new Set();
      for (const value of data.values()) {
        sanitizedSet.add(this.sanitize(value, depth + 1));
      }
      return sanitizedSet;
    }

    if (typeof data === 'object') {
      const dataObj = data as Record<string, unknown>;
      const sanitized: Record<string, unknown> = {};

      const sensitiveFields = this.getSensitiveFields();

      for (const key of Object.keys(dataObj)) {
        const lowerKey = key.toLowerCase();

        if (sensitiveFields.has(lowerKey)) {
          continue;
        }

        try {
          sanitized[key] = this.sanitize(dataObj[key], depth + 1);
        } catch (error) {
          // Silently skip fields that fail to sanitize to prevent errors from breaking the entire sanitization process
          // In debug mode, this could be logged, but for now we skip to maintain data flow
          continue;
        }
      }

      return sanitized;
    }

    return data;
  }

  static removeFields(
    data: unknown,
    fieldsToRemove: string[],
    depth: number = 0,
  ): unknown {
    if (depth > this.maxDepth) {
      return data;
    }

    if (data === null || data === undefined) {
      return data;
    }

    if (
      typeof data !== 'object' ||
      data instanceof Date ||
      data instanceof RegExp ||
      data instanceof Buffer ||
      data instanceof Error
    ) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) =>
        this.removeFields(item, fieldsToRemove, depth + 1),
      );
    }

    if (typeof data === 'object') {
      const dataObj = data as Record<string, unknown>;
      const sanitized: Record<string, unknown> = {};
      const fieldsToRemoveLower = fieldsToRemove.map((f) => f.toLowerCase());

      for (const key of Object.keys(dataObj)) {
        const lowerKey = key.toLowerCase();

        if (fieldsToRemoveLower.includes(lowerKey)) {
          continue;
        }

        try {
          sanitized[key] = this.removeFields(
            dataObj[key],
            fieldsToRemove,
            depth + 1,
          );
        } catch (error) {
          // Silently skip fields that fail to remove to prevent errors from breaking the entire removal process
          // In debug mode, this could be logged, but for now we skip to maintain data flow
          continue;
        }
      }

      return sanitized;
    }

    return data;
  }
}
