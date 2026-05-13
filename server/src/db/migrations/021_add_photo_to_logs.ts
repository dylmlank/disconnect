import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // challenge_logs already has photo_url (added in migration 010)
  // Add photo_url to habit_logs
  await knex.schema.alterTable('habit_logs', (table) => {
    table.text('photo_url').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('habit_logs', (table) => {
    table.dropColumn('photo_url');
  });
}
