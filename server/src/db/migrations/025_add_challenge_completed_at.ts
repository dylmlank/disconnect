import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('challenge_participants', (table) => {
    table.timestamp('completed_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('challenge_participants', (table) => {
    table.dropColumn('completed_at');
  });
}
