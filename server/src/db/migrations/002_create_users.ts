import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('phone_hash', 64).unique().notNullable();
    table.string('first_name', 50).notNullable();
    table.date('date_of_birth').notNullable();
    table.string('bio', 140).nullable();
    table.specificType('interests', 'text[]').defaultTo('{}');
    table.text('photo_url').nullable();
    table.boolean('is_minor').notNullable().defaultTo(false);
    table.string('device_token').nullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.raw(`
    SELECT AddGeometryColumn('users', 'approximate_location', 4326, 'POINT', 2)
  `);

  await knex.raw(`
    CREATE INDEX idx_users_location ON users USING GIST(approximate_location)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
