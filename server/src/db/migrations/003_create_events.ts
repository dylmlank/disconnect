import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('creator_id').notNullable().references('id').inTable('users');
    table.string('title', 100).notNullable();
    table.string('description', 500).nullable();
    table.string('address', 200).nullable();
    table.timestamp('starts_at', { useTz: true }).notNullable();
    table.timestamp('ends_at', { useTz: true }).nullable();
    table.string('category', 30).notNullable();
    table.integer('max_attendees').defaultTo(20);
    table.boolean('all_ages').defaultTo(false);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.raw(`
    SELECT AddGeometryColumn('events', 'location', 4326, 'POINT', 2)
  `);

  await knex.raw('CREATE INDEX idx_events_location ON events USING GIST(location)');
  await knex.raw('CREATE INDEX idx_events_starts_at ON events(starts_at)');
  await knex.raw('CREATE INDEX idx_events_category ON events(category)');

  await knex.schema.createTable('event_rsvps', (table) => {
    table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.timestamp('joined_at', { useTz: true }).defaultTo(knex.fn.now());
    table.primary(['event_id', 'user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('event_rsvps');
  await knex.schema.dropTableIfExists('events');
}
