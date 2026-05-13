import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('badges', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('badge_id', 30).notNullable(); // from curated list
    table.timestamp('earned_at', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['user_id', 'badge_id']);
  });

  await knex.schema.raw('CREATE INDEX idx_badges_user ON badges(user_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('badges');
}
