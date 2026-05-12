import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_habits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.string('habit_id', 30).notNullable();
    table.string('custom_name', 50).nullable();
    table.integer('position').notNullable().defaultTo(0);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['user_id', 'habit_id']);
  });

  await knex.schema.createTable('habit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.string('habit_id', 30).notNullable();
    table.date('logged_date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    table.timestamp('logged_at', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['user_id', 'habit_id', 'logged_date']);
  });

  await knex.schema.raw('CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, logged_date DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('habit_logs');
  await knex.schema.dropTableIfExists('user_habits');
}
