import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ProviderLoginType } from '../enums/provider-login-type.enum';
import { Client } from '@/client/entities/client.entity';

@Entity('provider_credentials')
@Index(['provider_slug', 'loginType'], { unique: false })
export class ProviderCredential {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 50, comment: 'Identificador do provedor (ex: hiperbanco)' })
    provider_slug: string;

    @Column({
        type: 'enum',
        enum: ProviderLoginType,
        name: 'login_type',
        comment: 'Tipo de login: backoffice (email/senha) ou bank (documento/senha)',
    })
    loginType: ProviderLoginType;

    @Column({ type: 'varchar', length: 255, comment: 'Usuário/Email para login' })
    login: string;

    @Column({ type: 'text', comment: 'Senha criptografada' })
    @Exclude({ toPlainOnly: true })
    password: string;

    @Column({
        type: 'uuid',
        name: 'client_id',
        nullable: true,
        comment: 'ID do cliente multi-tenant',
    })
    clientId?: string;

    @ManyToOne(() => Client)
    @JoinColumn({ name: 'client_id' })
    client?: Client;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt?: Date;
}
