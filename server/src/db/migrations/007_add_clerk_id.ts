import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('clerk_id', 128).nullable().unique();
  });

  // Make phone_hash nullable — Clerk owns phone identity now
  await knex.raw(`ALTER TABLE users ALTER COLUMN phone_hash DROP NOT NULL`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE users ALTER COLUMN phone_hash SET NOT NULL`);

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('clerk_id');
  });
}
