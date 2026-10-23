#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/118a90056b94e94c8f32a16670e2ddf657c68ec2a8f011fe4c84d331e44de9c7/contract';
import endContract from '../../snapshots/118a90056b94e94c8f32a16670e2ddf657c68ec2a8f011fe4c84d331e44de9c7/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/1e8412e162dbbe69f4bb3bf8d07f0280ae67eaab15c34dcf201e67468315428d/contract';
import startContract from '../../snapshots/1e8412e162dbbe69f4bb3bf8d07f0280ae67eaab15c34dcf201e67468315428d/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  placeholder,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'post' }),
      this.dropColumn({ schema: 'public', table: 'user', column: 'username' }),
      this.createTable({
        schema: 'public',
        table: 'githubAccount',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('encryptedToken', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('githubUsername', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'repository',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('fullName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('githubAccountId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('githubRepoId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('repoName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('passwordHash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-user-passwordHash', {
        check: () => placeholder('backfill-user-passwordHash:check'),
        run: () => placeholder('backfill-user-passwordHash:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'user', column: 'passwordHash' }),
      this.dataTransform(endContract, 'handle-nulls-user-name', {
        check: () => placeholder('handle-nulls-user-name:check'),
        run: () => placeholder('handle-nulls-user-name:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'user', column: 'name' }),
      this.addUnique({
        schema: 'public',
        table: 'githubAccount',
        constraint: 'githubAccount_userId_key',
        columns: ['userId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'repository',
        constraint: 'repository_githubAccountId_githubRepoId_key',
        columns: ['githubAccountId', 'githubRepoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'repository',
        index: 'repository_githubAccountId_idx_2ee20edd',
        columns: ['githubAccountId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'githubAccount',
        foreignKey: {
          name: 'githubAccount_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'repository',
        foreignKey: {
          name: 'repository_githubAccountId_fkey',
          columns: ['githubAccountId'],
          references: { schema: 'public', table: 'githubAccount', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
