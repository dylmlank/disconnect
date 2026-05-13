import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('study_rooms', (table) => {
    table.string('room_type', 20).notNullable().defaultTo('study');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('study_rooms', (table) => {
    table.dropColumn('room_type');
  });
}
