import { DataSource } from 'typeorm';
import { Permission } from '@/permissions/entities/permission.entity';

export const permissions = [
  // Financial scopes
  {
    name: 'financial:boleto',
    module: 'financial',
    action: 'boleto',
    description: 'Access to boleto operations',
  },
  {
    name: 'financial:payment',
    module: 'financial',
    action: 'payment',
    description: 'Access to payment operations',
  },
  // Integration scopes
  {
    name: 'integration:webhook',
    module: 'integration',
    action: 'webhook',
    description: 'Access to webhook management',
  },
  // Auth scopes
  {
    name: 'auth:bank',
    module: 'auth',
    action: 'bank',
    description: 'Access to bank authentication',
  },
  {
    name: 'auth:backoffice',
    module: 'auth',
    action: 'backoffice',
    description: 'Access to backoffice authentication',
  },
];

export async function seedPermissions(dataSource: DataSource): Promise<Permission[]> {
  const permissionRepository = dataSource.getRepository(Permission);
  const createdPermissions: Permission[] = [];

  for (const permissionData of permissions) {
    const existingPermission = await permissionRepository.findOne({
      where: {
        name: permissionData.name,
      },
    });

    if (!existingPermission) {
      const permission = permissionRepository.create(permissionData);
      const savedPermission = await permissionRepository.save(permission);
      createdPermissions.push(savedPermission);
      console.log(`✓ Created permission: ${permissionData.name}`);
    } else {
      console.log(`- Permission already exists: ${permissionData.name}`);
      createdPermissions.push(existingPermission);
    }
  }

  return createdPermissions;
}
