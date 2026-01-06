import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('provider_credentials')
@Index(['provider_slug'], { unique: false })
export class ProviderCredential {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 50, comment: 'Identificador do provedor (ex: hiperbanco)' })
    provider_slug: string;

    @Column({ type: 'varchar', length: 255, comment: 'Usuário/Email genérico para login' })
    login: string;

    @Column({ type: 'text', comment: 'Senha criptografada' })
    @Exclude({ toPlainOnly: true })
    password: string;

    @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Client ID interno gerado pela aplicação' })
    client_id: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt?: Date;
}
