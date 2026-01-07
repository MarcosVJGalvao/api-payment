import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';
import { WebhookContext } from '../enums/webhook-context.enum';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

@Entity('webhook')
export class Webhook {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        length: 50,
        comment: 'Nome do webhook definido pelo usuário',
    })
    name: string;

    @Column({
        type: 'enum',
        enum: WebhookContext,
        comment: 'Contexto do evento (ex: Boleto, Pix)',
    })
    context: WebhookContext;

    @Column({
        type: 'varchar',
        length: 255,
        name: 'event_name',
        comment: 'Nome do evento assinado',
    })
    eventName: string;

    @Column({
        type: 'varchar',
        length: 500,
        comment: 'Endpoint de callback para receber eventos',
    })
    uri: string;

    @Column({
        type: 'varchar',
        length: 50,
        name: 'provider_slug',
        comment: 'Identificador do provedor financeiro',
    })
    providerSlug: FinancialProvider;

    @Column({
        type: 'varchar',
        length: 255,
        name: 'external_id',
        nullable: true,
        comment: 'ID retornado pelo provedor ao registrar o webhook',
    })
    externalId: string;

    @Column({
        type: 'text',
        name: 'public_key',
        nullable: true,
        comment: 'Chave pública para validação de assinatura',
    })
    publicKey: string;

    @Column({
        type: 'boolean',
        name: 'is_active',
        default: true,
        comment: 'Status do webhook',
    })
    isActive: boolean;

    @CreateDateColumn({
        name: 'created_at',
        type: 'datetime',
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'datetime',
    })
    updatedAt: Date;

    @DeleteDateColumn({
        name: 'deleted_at',
        type: 'datetime',
    })
    deletedAt?: Date;
}
