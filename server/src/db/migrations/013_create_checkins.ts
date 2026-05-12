import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('check_ins', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.integer('mood').notNullable();
    table.string('good_thing_1', 100).notNullable();
    table.string('good_thing_2', 100).notNullable();
    table.string('good_thing_3', 100).notNullable();
    table.string('intention', 50).nullable();
    table.date('check_in_date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['user_id', 'check_in_date']);
  });

  // Enforce mood range at DB level
  await knex.raw('ALTER TABLE check_ins ADD CONSTRAINT check_ins_mood_range CHECK (mood BETWEEN 1 AND 5)');

  await knex.schema.raw('CREATE INDEX idx_checkins_user_date ON check_ins(user_id, check_in_date DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('check_ins');
}
