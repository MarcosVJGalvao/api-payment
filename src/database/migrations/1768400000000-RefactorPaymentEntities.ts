import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class RefactorPaymentEntities1768400000000 implements MigrationInterface {
  name = 'RefactorPaymentEntities1768400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Helper Tables
    await this.createPaymentSenderTable(queryRunner);
    await this.createPaymentRecipientTable(queryRunner);
    await this.createBoletoPayerTable(queryRunner);

    // 2. Add FK Columns (Nullable first)
    await this.addForeignKeyColumns(queryRunner);

    // 3. ETL - Migrating Data
    await this.migratePixTransferData(queryRunner);
    await this.migratePixCashInData(queryRunner);
    await this.migratePixRefundData(queryRunner);
    await this.migrateBoletoData(queryRunner);
    await this.migrateBillPaymentData(queryRunner);

    // 4. Cleanup - Drop Old Columns
    await this.dropOldColumns(queryRunner);

    // 5. Alter Column Types (Amount 10,2 -> 15,2)
    const tablesToAlter = ['pix_transfer', 'boleto', 'bill_payment'];
    for (const table of tablesToAlter) {
      await queryRunner.query(
        `ALTER TABLE \`${table}\` MODIFY COLUMN \`amount\` DECIMAL(15,2)`,
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Destructive down skipped for brevity as requested in similar items
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  private async createPaymentSenderTable(queryRunner: QueryRunner) {
    const tableExists = await queryRunner.hasTable('payment_sender');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'payment_sender',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
              collation: 'utf8mb4_0900_ai_ci',
            },
            { name: 'name', type: 'varchar', length: '255', isNullable: true },
            {
              name: 'trade_name',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'document_type',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'document_number',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'bank_name',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'bank_ispb',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'bank_compe',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'account_branch',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'account_number',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'account_type',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
              onUpdate: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
      );
    }
  }

  private async createPaymentRecipientTable(queryRunner: QueryRunner) {
    const tableExists = await queryRunner.hasTable('payment_recipient');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'payment_recipient',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
              collation: 'utf8mb4_0900_ai_ci',
            },
            { name: 'name', type: 'varchar', length: '255', isNullable: true },
            {
              name: 'document_type',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'document_number',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            { name: 'type', type: 'varchar', length: '20', isNullable: true },
            {
              name: 'bank_name',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'bank_ispb',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'bank_compe',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'account_branch',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'account_number',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'account_type',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            { name: 'status', type: 'varchar', length: '50', isNullable: true },
            {
              name: 'account_status',
              type: 'varchar',
              length: '50',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
              onUpdate: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
      );
    }
  }

  private async createBoletoPayerTable(queryRunner: QueryRunner) {
    const tableExists = await queryRunner.hasTable('boleto_payer');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'boleto_payer',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
              collation: 'utf8mb4_unicode_ci',
            },
            { name: 'name', type: 'varchar', length: '255', isNullable: true },
            {
              name: 'trade_name',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'document',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            { name: 'address', type: 'json', isNullable: true },
            {
              name: 'created_at',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
              onUpdate: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
      );
    }
  }

  private async addForeignKeyColumns(queryRunner: QueryRunner) {
    // Array of (Table, Column, RefTable, RefColumn, FKName)
    const configurations = [
      {
        table: 'pix_transfer',
        column: 'sender_id',
        refTable: 'payment_sender',
        fkName: 'FK_pix_transfer_sender',
        collation: 'utf8mb4_0900_ai_ci',
      },
      {
        table: 'pix_transfer',
        column: 'recipient_id',
        refTable: 'payment_recipient',
        fkName: 'FK_pix_transfer_recipient',
        collation: 'utf8mb4_0900_ai_ci',
      },
      {
        table: 'pix_cash_in',
        column: 'sender_id',
        refTable: 'payment_sender',
        fkName: 'FK_pix_cash_in_sender',
        collation: 'utf8mb4_0900_ai_ci',
      },
      {
        table: 'pix_cash_in',
        column: 'recipient_id',
        refTable: 'payment_recipient',
        fkName: 'FK_pix_cash_in_recipient',
        collation: 'utf8mb4_0900_ai_ci',
      },
      {
        table: 'pix_refund',
        column: 'sender_id',
        refTable: 'payment_sender',
        fkName: 'FK_pix_refund_sender',
        collation: 'utf8mb4_0900_ai_ci',
      },
      {
        table: 'pix_refund',
        column: 'recipient_id',
        refTable: 'payment_recipient',
        fkName: 'FK_pix_refund_recipient',
        collation: 'utf8mb4_0900_ai_ci',
      },
      {
        table: 'boleto',
        column: 'payer_id',
        refTable: 'boleto_payer',
        fkName: 'FK_boleto_payer',
        collation: 'utf8mb4_unicode_ci',
      },
      {
        table: 'bill_payment',
        column: 'recipient_id',
        refTable: 'payment_recipient',
        fkName: 'FK_bill_payment_recipient',
        collation: 'utf8mb4_0900_ai_ci',
      },
    ];

    for (const config of configurations) {
      // 1. Add Column if not exists
      const table = await queryRunner.getTable(config.table);
      const column = table?.findColumnByName(config.column);
      if (!column) {
        await queryRunner.addColumn(
          config.table,
          new TableColumn({
            name: config.column,
            type: 'varchar',
            length: '36',
            isNullable: true,
            collation: (config as any).collation,
          }),
        );
      }

      // 2. Add FK if not exists
      const fkExists = table?.foreignKeys.find(
        (fk) => fk.columnNames.indexOf(config.column) !== -1,
      );
      if (!fkExists) {
        await queryRunner.createForeignKey(
          config.table,
          new TableForeignKey({
            name: config.fkName,
            columnNames: [config.column],
            referencedTableName: config.refTable,
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }
    }
  }

  private async migratePixTransferData(queryRunner: QueryRunner) {
    const rows = await queryRunner.query('SELECT * FROM pix_transfer');
    for (const row of rows) {
      if (row.sender_id || row.recipient_id) continue; // Already migrated

      const senderId = await this.insertSender(
        queryRunner,
        row.sender_name,
        row.sender_document_type,
        row.sender_document_number,
        row.sender_bank_ispb,
        null,
        row.sender_account_branch,
        row.sender_account_number,
        row.sender_account_type,
      );

      const recipientId = await this.insertRecipient(
        queryRunner,
        row.recipient_name,
        row.recipient_document_type,
        row.recipient_document_number,
        row.recipient_bank_name,
        row.recipient_bank_ispb,
        row.recipient_bank_compe,
        row.recipient_account_branch,
        row.recipient_account_number,
        row.recipient_account_type,
      );

      await queryRunner.query(
        'UPDATE pix_transfer SET sender_id = ?, recipient_id = ? WHERE id = ?',
        [senderId, recipientId, row.id],
      );
    }
  }

  private async migratePixCashInData(queryRunner: QueryRunner) {
    const rows = await queryRunner.query('SELECT * FROM pix_cash_in');
    for (const row of rows) {
      if (row.sender_id || row.recipient_id) continue;

      const senderId = await this.insertSender(
        queryRunner,
        row.sender_name,
        row.sender_document_type,
        row.sender_document_number,
        row.sender_bank_ispb,
        row.sender_bank_name,
        row.sender_account_branch,
        row.sender_account_number,
        row.sender_account_type,
      );

      const recipientId = await this.insertRecipient(
        queryRunner,
        row.recipient_name,
        row.recipient_document_type,
        row.recipient_document_number,
        null,
        row.recipient_bank_ispb,
        null,
        row.recipient_account_branch,
        row.recipient_account_number,
        row.recipient_account_type,
        row.recipient_type,
        row.recipient_status,
        row.recipient_account_status,
      );

      await queryRunner.query(
        'UPDATE pix_cash_in SET sender_id = ?, recipient_id = ? WHERE id = ?',
        [senderId, recipientId, row.id],
      );
    }
  }

  private async migratePixRefundData(queryRunner: QueryRunner) {
    const rows = await queryRunner.query('SELECT * FROM pix_refund');
    for (const row of rows) {
      if (row.sender_id || row.recipient_id) continue;

      const senderId = await this.insertSender(
        queryRunner,
        row.sender_name,
        row.sender_document_type,
        row.sender_document_number,
        row.sender_bank_ispb,
        null,
        row.sender_account_branch,
        row.sender_account_number,
        row.sender_account_type,
      );

      const recipientId = await this.insertRecipient(
        queryRunner,
        row.recipient_name,
        row.recipient_document_type,
        row.recipient_document_number,
        null,
        row.recipient_bank_ispb,
        null,
        row.recipient_account_branch,
        row.recipient_account_number,
        row.recipient_account_type,
        row.recipient_type,
      );

      await queryRunner.query(
        'UPDATE pix_refund SET sender_id = ?, recipient_id = ? WHERE id = ?',
        [senderId, recipientId, row.id],
      );
    }
  }

  private async migrateBoletoData(queryRunner: QueryRunner) {
    const rows = await queryRunner.query('SELECT * FROM boleto');
    for (const row of rows) {
      if (row.payer_id) continue;

      const payerId = await this.insertBoletoPayer(
        queryRunner,
        row.payer_name,
        row.payer_trade_name,
        row.payer_document,
        row.payer_address,
      );
      await queryRunner.query('UPDATE boleto SET payer_id = ? WHERE id = ?', [
        payerId,
        row.id,
      ]);
    }
  }

  private async migrateBillPaymentData(queryRunner: QueryRunner) {
    const rows = await queryRunner.query('SELECT * FROM bill_payment');
    for (const row of rows) {
      if (row.recipient_id) continue;

      const recipientId = await this.insertRecipient(
        queryRunner,
        row.recipient_name,
        null,
        row.recipient_document,
        null,
        null,
        null,
        null,
        null,
        null,
      );
      await queryRunner.query(
        'UPDATE bill_payment SET recipient_id = ? WHERE id = ?',
        [recipientId, row.id],
      );
    }
  }

  private async dropOldColumns(queryRunner: QueryRunner) {
    // Helper to drop if exists
    const dropIfExists = async (table: string, column: string) => {
      const hasColumn = await queryRunner.hasColumn(table, column);
      if (hasColumn) {
        await queryRunner.dropColumn(table, column);
      }
    };

    // PixTransfer
    const transferCols = [
      'sender_document_type',
      'sender_document_number',
      'sender_name',
      'sender_account_branch',
      'sender_account_number',
      'sender_account_type',
      'sender_bank_ispb',
      'recipient_document_type',
      'recipient_document_number',
      'recipient_name',
      'recipient_account_branch',
      'recipient_account_number',
      'recipient_account_type',
      'recipient_bank_ispb',
      'recipient_bank_compe',
      'recipient_bank_name',
    ];
    for (const col of transferCols) await dropIfExists('pix_transfer', col);

    // PixCashIn
    const cashInCols = [
      'sender_document_type',
      'sender_document_number',
      'sender_name',
      'sender_type',
      'sender_account_branch',
      'sender_account_number',
      'sender_account_type',
      'sender_bank_ispb',
      'sender_bank_name',
      'recipient_document_type',
      'recipient_document_number',
      'recipient_name',
      'recipient_type',
      'recipient_account_branch',
      'recipient_account_number',
      'recipient_account_type',
      'recipient_bank_ispb',
      'recipient_status',
      'recipient_account_status',
    ];
    for (const col of cashInCols) await dropIfExists('pix_cash_in', col);

    // PixRefund
    const refundCols = [
      'sender_document_type',
      'sender_document_number',
      'sender_name',
      'sender_type',
      'sender_account_branch',
      'sender_account_number',
      'sender_account_type',
      'sender_bank_ispb',
      'recipient_document_type',
      'recipient_document_number',
      'recipient_name',
      'recipient_type',
      'recipient_account_branch',
      'recipient_account_number',
      'recipient_account_type',
      'recipient_bank_ispb',
    ];
    for (const col of refundCols) await dropIfExists('pix_refund', col);

    // Boleto
    const boletoCols = [
      'payer_document',
      'payer_name',
      'payer_trade_name',
      'payer_address',
    ];
    for (const col of boletoCols) await dropIfExists('boleto', col);

    // BillPayment
    const billCols = ['recipient_name', 'recipient_document'];
    for (const col of billCols) await dropIfExists('bill_payment', col);
  }

  private async insertSender(
    queryRunner: QueryRunner,
    name: any,
    docType: any,
    docNum: any,
    ispb: any,
    bankName: any,
    branch: any,
    accNum: any,
    accType: any,
  ): Promise<string> {
    const id = this.generateUuid();
    await queryRunner.query(
      `INSERT INTO payment_sender (id, name, document_type, document_number, bank_ispb, bank_name, account_branch, account_number, account_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, docType, docNum, ispb, bankName, branch, accNum, accType],
    );
    return id;
  }

  private async insertRecipient(
    queryRunner: QueryRunner,
    name: any,
    docType: any,
    docNum: any,
    bankName: any,
    ispb: any,
    compe: any,
    branch: any,
    accNum: any,
    accType: any,
    type?: any,
    status?: any,
    accStatus?: any,
  ): Promise<string> {
    const id = this.generateUuid();
    await queryRunner.query(
      `INSERT INTO payment_recipient (id, name, document_type, document_number, bank_name, bank_ispb, bank_compe, account_branch, account_number, account_type, type, status, account_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        docType,
        docNum,
        bankName,
        ispb,
        compe,
        branch,
        accNum,
        accType,
        type,
        status,
        accStatus,
      ],
    );
    return id;
  }

  private async insertBoletoPayer(
    queryRunner: QueryRunner,
    name: any,
    tradeName: any,
    doc: any,
    address: any,
  ): Promise<string> {
    const id = this.generateUuid();
    // Handling JSON address
    const addressJson = address
      ? typeof address === 'string'
        ? address
        : JSON.stringify(address)
      : null;
    await queryRunner.query(
      `INSERT INTO boleto_payer (id, name, trade_name, document, address) VALUES (?, ?, ?, ?, ?)`,
      [id, name, tradeName, doc, addressJson],
    );
    return id;
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }
}
