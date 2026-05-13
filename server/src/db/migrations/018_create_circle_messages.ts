import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('circle_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('circle_id').notNullable().references('id').inTable('circles').onDelete('CASCADE');
    table.uuid('sender_id').notNullable().references('id').inTable('users');
    table.string('message', 500).notNullable();
    table.timestamp('sent_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_circle_messages_circle ON circle_messages(circle_id, sent_at DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('circle_messages');
}
