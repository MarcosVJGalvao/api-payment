import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteBackofficeUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a Backoffice User' }),
    ApiParam({ name: 'id', description: 'User ID' }),
    ApiResponse({
      status: 204,
      description: 'User deleted successfully',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
    }),
  );
}
