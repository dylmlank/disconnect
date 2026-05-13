import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('reports', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('reporter_id').notNullable().references('id').inTable('users');
    table.uuid('reported_user_id').nullable().references('id').inTable('users');
    table.string('target_type', 20).notNullable(); // 'user', 'event', 'beacon', 'chat_message'
    table.uuid('target_id').notNullable();
    table.string('reason', 30).notNullable(); // 'harassment', 'spam', 'inappropriate', 'safety', 'other'
    table.string('details', 500).nullable();
    table.string('status', 20).notNullable().defaultTo('pending'); // 'pending', 'reviewed', 'actioned', 'dismissed'
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('reviewed_at', { useTz: true }).nullable();
  });

  await knex.schema.raw('CREATE INDEX idx_reports_status ON reports(status) WHERE status = \'pending\'');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('reports');
}
