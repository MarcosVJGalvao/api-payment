import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';

/**
 * Repositório para operações de persistência da entidade Transaction.
 */
@Injectable()
export class TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
  ) {}

  /**
   * Cria uma nova transação.
   */
  create(data: Partial<Transaction>): Transaction {
    return this.repository.create(data);
  }

  /**
   * Salva uma transação no banco de dados.
   */
  async save(transaction: Transaction): Promise<Transaction> {
    return this.repository.save(transaction);
  }

  /**
   * Busca transação por authenticationCode.
   */
  async findByAuthenticationCode(
    authenticationCode: string,
  ): Promise<Transaction | null> {
    return this.repository.findOne({
      where: { authenticationCode },
    });
  }

  /**
   * Busca transação por ID.
   */
  async findById(id: string): Promise<Transaction | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Lista transações por conta (para extratos).
   */
  async findByAccountId(accountId: string): Promise<Transaction[]> {
    return this.repository.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lista transações por cliente.
   */
  async findByClientId(clientId: string): Promise<Transaction[]> {
    return this.repository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }
}
