import { Repository, In } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { HttpStatus } from '@nestjs/common';

/**
 * Busca permissões por nomes ou IDs
 * @param permissionRepository - Repositório de permissões
 * @param permissionNames - Array de nomes de permissões (opcional)
 * @param permissionIds - Array de IDs de permissões (opcional)
 * @returns Array de permissões encontradas
 * @throws CustomHttpException se alguma permissão não for encontrada
 */
export async function findPermissions(
  permissionRepository: Repository<Permission>,
  permissionNames?: string[],
  permissionIds?: string[],
): Promise<Permission[]> {
  let permissions: Permission[] = [];

  if (permissionNames && permissionNames.length > 0) {
    permissions = await permissionRepository.find({
      where: { name: In(permissionNames) },
    });

    if (permissions.length !== permissionNames.length) {
      throw new CustomHttpException(
        'One or more permissions not found.',
        HttpStatus.NOT_FOUND,
        ErrorCode.PERMISSION_NOT_FOUND,
      );
    }
  } else if (permissionIds && permissionIds.length > 0) {
    permissions = await permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    if (permissions.length !== permissionIds.length) {
      throw new CustomHttpException(
        'One or more permissions not found.',
        HttpStatus.NOT_FOUND,
        ErrorCode.PERMISSION_NOT_FOUND,
      );
    }
  }

  return permissions;
}
