import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('event_chat_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
    table.uuid('sender_id').notNullable().references('id').inTable('users');
    table.string('message', 500).notNullable();
    table.timestamp('sent_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_event_chat_event_id ON event_chat_messages(event_id)');
  await knex.raw('CREATE INDEX idx_event_chat_sent_at ON event_chat_messages(event_id, sent_at)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('event_chat_messages');
}
