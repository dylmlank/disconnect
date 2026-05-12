import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('reactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.string('target_type', 20).notNullable(); // habit_log, check_in, challenge_log, focus_session
    table.uuid('target_id').notNullable();
    table.string('emoji', 4).notNullable().defaultTo('🔥');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['user_id', 'target_type', 'target_id']);
  });

  await knex.schema.raw('CREATE INDEX idx_reactions_target ON reactions(target_type, target_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('reactions');
}
