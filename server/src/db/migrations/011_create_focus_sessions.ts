import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('focus_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.string('intention', 100).nullable();
    table.integer('duration_minutes').notNullable();
    table.timestamp('started_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('ended_at', { useTz: true }).nullable();
    table.boolean('completed').defaultTo(false);
    table.uuid('circle_id').nullable().references('id').inTable('circles');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_focus_sessions_user ON focus_sessions(user_id, started_at DESC)');
  await knex.schema.raw('CREATE INDEX idx_focus_sessions_active ON focus_sessions(ended_at) WHERE ended_at IS NULL');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('focus_sessions');
}
