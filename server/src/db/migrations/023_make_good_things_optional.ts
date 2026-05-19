import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('check_ins', (table) => {
    table.string('good_thing_2', 100).nullable().alter();
    table.string('good_thing_3', 100).nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('check_ins', (table) => {
    table.string('good_thing_2', 100).notNullable().alter();
    table.string('good_thing_3', 100).notNullable().alter();
  });
}
