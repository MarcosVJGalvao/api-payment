import { HttpStatus } from '@nestjs/common';
import { parse, formatISO, format, isValid, getTime } from 'date-fns';
import { CustomHttpException } from '../errors/exceptions/custom-http.exception';
import { ErrorCode } from '../errors/enums/error-code.enum';

/**
 * Parseia uma string de data com hora no formato 'yyyy-MM-dd HH:mm'
 * @param dateString - String da data a ser parseada
 * @returns Date parseada
 * @throws CustomHttpException se a data for inválida
 */
export function parseDateString(dateString: string): Date {
  if (typeof dateString !== 'string') {
    throw new CustomHttpException(
      'Invalid date value: Expected a string but received ' +
        typeof dateString +
        '. Value: ' +
        String(dateString),
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_DATE,
    );
  }

  const parsedDate = parse(dateString, 'yyyy-MM-dd HH:mm', new Date());

  if (!isValid(parsedDate)) {
    throw new CustomHttpException(
      `Invalid date value: ${dateString}. Expected format: YYYY-MM-DD HH:mm`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_DATE,
    );
  }

  return parsedDate;
}

/**
 * Parseia uma string de data no formato 'yyyy-MM-dd'
 * @param dateString - String da data a ser parseada
 * @returns Date parseada (com hora 00:00:00)
 * @throws CustomHttpException se a data for inválida
 */
export function parseDateOnly(dateString: string): Date {
  if (typeof dateString !== 'string') {
    throw new CustomHttpException(
      'Invalid date value: Expected a string but received ' +
        typeof dateString +
        '. Value: ' +
        String(dateString),
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_DATE,
    );
  }

  const yyyyMmDdRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!yyyyMmDdRegex.test(dateString)) {
    throw new CustomHttpException(
      `Invalid date value: ${dateString}. Expected format: YYYY-MM-DD`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_DATE,
    );
  }

  const [year, month, day] = dateString.split('-').map(Number);
  const parsedDate = new Date(year, month - 1, day, 0, 0, 0, 0);

  if (!isValid(parsedDate)) {
    throw new CustomHttpException(
      `Invalid date value: ${dateString}. Expected format: YYYY-MM-DD`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_DATE,
    );
  }
  return parsedDate;
}

/**
 * Transforma um objeto Date em string ISO 8601 completa
 * @param date - Objeto Date a ser transformado
 * @returns String no formato ISO 8601
 * @throws CustomHttpException se a data for inválida
 */
export function transformToISO(date: Date): string {
  if (!isValid(date)) {
    throw new CustomHttpException(
      `Invalid date object received for ISO transformation.`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_DATE,
    );
  }
  return formatISO(date, { representation: 'complete' });
}

/**
 * Formata um objeto Date em string customizada 'yyyy-MM-dd HH:mm:ss'
 * @param date - Objeto Date a ser formatado
 * @returns String formatada
 * @throws CustomHttpException se a data for inválida
 */
export function formatToCustomISO(date: Date): string {
  if (!isValid(date)) {
    throw new CustomHttpException(
      `Invalid date object received for custom format.`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_DATE,
    );
  }
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Formata um objeto Date em string apenas com a data 'yyyy-MM-dd'
 * @param date - Objeto Date a ser formatado
 * @returns String formatada apenas com a data
 * @throws CustomHttpException se a data for inválida
 */
export function formatDateOnly(date: Date): string {
  if (!isValid(date)) {
    throw new CustomHttpException(
      `Invalid date object received for date-only format.`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_DATE,
    );
  }
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parseia uma string de data no formato ISO 8601
 * @param dateString - String da data a ser parseada
 * @returns Date parseada
 * @throws CustomHttpException se a data for inválida
 */
export function parseISO(dateString: string): Date {
  if (typeof dateString !== 'string') {
    throw new CustomHttpException(
      'Invalid date value: Expected a string but received ' +
        typeof dateString +
        '. Value: ' +
        String(dateString),
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_DATE,
    );
  }

  const parsedDate = new Date(dateString);

  if (!isValid(parsedDate) || isNaN(parsedDate.getTime())) {
    throw new CustomHttpException(
      `Invalid date value: ${dateString}. Expected format: ISO 8601`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_DATE,
    );
  }

  return parsedDate;
}

/**
 * Detecta automaticamente o formato da data e usa o parser apropriado
 * Suporta os seguintes formatos:
 * - ISO completo: 2025-11-11T20:50:52.000Z
 * - Com hora: 2025-11-11 20:50
 * - Apenas data: 2025-11-11
 * @param dateString - String da data a ser parseada
 * @returns Date parseada
 */
export function parseDate(dateString: string): Date {
  if (dateString.includes('T') || dateString.endsWith('Z')) {
    return parseISO(dateString);
  }
  if (dateString.includes(' ') && dateString.includes(':')) {
    return parseDateString(dateString);
  }
  return parseDateOnly(dateString);
}

/**
 * Retorna a data e hora atual usando date-fns para garantir tratamento adequado
 * Utiliza date-fns para criar e validar a data atual
 * @returns Date com a data e hora atual validada
 */
export function getCurrentDate(): Date {
  const timestamp = getTime(new Date());
  const currentDate = new Date(timestamp);

  if (!isValid(currentDate)) {
    throw new CustomHttpException(
      'Failed to get current date',
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INVALID_DATE,
    );
  }

  return currentDate;
}
