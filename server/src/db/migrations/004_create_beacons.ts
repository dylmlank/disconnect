import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('beacons', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('creator_id').notNullable().references('id').inTable('users');
    table.string('message', 140).notNullable();
    table.string('activity', 50).nullable();
    table.string('place_name', 100).nullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.raw(`
    SELECT AddGeometryColumn('beacons', 'location', 4326, 'POINT', 2)
  `);

  await knex.raw('CREATE INDEX idx_beacons_location ON beacons USING GIST(location)');
  await knex.raw('CREATE INDEX idx_beacons_expires_at ON beacons(expires_at)');

  await knex.schema.createTable('beacon_interests', (table) => {
    table.uuid('beacon_id').notNullable().references('id').inTable('beacons').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.timestamp('expressed_at', { useTz: true }).defaultTo(knex.fn.now());
    table.primary(['beacon_id', 'user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('beacon_interests');
  await knex.schema.dropTableIfExists('beacons');
}
