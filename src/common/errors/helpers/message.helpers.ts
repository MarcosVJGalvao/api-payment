/**
 * Message extraction and formatting helpers
 */

import { isRecord } from './type.helpers';
import { joinStrings } from './string.helpers';

/**
 * Formats a validation error message with full property path (internal recursive function)
 * @param msg - Validation error object that may have children
 * @param parentPath - Accumulated path from parent levels (used for recursion)
 * @returns Formatted error message with full path
 */
function formatConstraintMessageRecursive(
  msg: any,
  parentPath: string = '',
): string {
  if (typeof msg !== 'object' || msg === null || !('property' in msg)) {
    return String(msg);
  }

  // Build current path
  const currentPath = parentPath
    ? `${parentPath}.${String(msg.property)}`
    : String(msg.property);

  // If this level has constraints, format and return the message
  if ('constraints' in msg && msg.constraints) {
    const constraintsObj = msg.constraints;
    if (isRecord(constraintsObj)) {
      const constraints = Object.values(constraintsObj);
      const constraintStrings: string[] = [];
      for (let i = 0; i < constraints.length; i++) {
        constraintStrings.push(String(constraints[i]));
      }
      return `${currentPath}: ${joinStrings(constraintStrings, ', ')}`;
    }
  }

  // If there are children, process them recursively
  if (
    'children' in msg &&
    Array.isArray(msg.children) &&
    msg.children.length > 0
  ) {
    for (const child of msg.children) {
      const childMessage = formatConstraintMessageRecursive(child, currentPath);
      // If child message is different from stringified child, it means we found a constraint
      if (childMessage && childMessage !== String(child)) {
        return childMessage;
      }
    }
  }

  return String(msg);
}

/**
 * Formats a validation error message with full property path
 * @param msg - Validation error object
 * @returns Formatted error message with full path (e.g., "studentGuardians.0.guardian.person.contactInfos.0: should not be empty")
 */
export function formatConstraintMessage(msg: any): string {
  return formatConstraintMessageRecursive(msg, '');
}

export function extractMessage(exceptionResponse: any): string | string[] {
  if (typeof exceptionResponse === 'string') {
    return exceptionResponse;
  }

  if (
    typeof exceptionResponse === 'object' &&
    exceptionResponse !== null &&
    'message' in exceptionResponse
  ) {
    const msg = exceptionResponse.message;
    if (Array.isArray(msg)) {
      const formatted: string[] = [];
      for (let i = 0; i < msg.length; i++) {
        formatted.push(formatConstraintMessage(msg[i]));
      }
      return formatted;
    }
    return String(msg);
  }

  try {
    return JSON.stringify(exceptionResponse);
  } catch {
    return 'An error occurred';
  }
}
