import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('study_rooms', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('creator_id').notNullable().references('id').inTable('users');
    table.string('name', 50).notNullable();
    table.string('vibe', 30).notNullable(); // lofi, deep_work, morning, chill, library
    table.boolean('is_public').notNullable().defaultTo(true);
    table.uuid('circle_id').nullable().references('id').inTable('circles');
    table.integer('active_count').notNullable().defaultTo(0);
    table.integer('total_hours').notNullable().defaultTo(0);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.raw(`SELECT AddGeometryColumn('study_rooms', 'location', 4326, 'POINT', 2)`);
  await knex.schema.raw('CREATE INDEX idx_study_rooms_public ON study_rooms(is_public) WHERE is_public = true');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('study_rooms');
}
