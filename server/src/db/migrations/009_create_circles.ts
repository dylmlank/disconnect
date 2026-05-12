import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('circles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 50).notNullable();
    table.uuid('creator_id').notNullable().references('id').inTable('users');
    table.string('invite_code', 8).unique().notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('circle_members', (table) => {
    table.uuid('circle_id').notNullable().references('id').inTable('circles').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.timestamp('joined_at', { useTz: true }).defaultTo(knex.fn.now());
    table.primary(['circle_id', 'user_id']);
  });

  await knex.schema.raw('CREATE INDEX idx_circle_members_user ON circle_members(user_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('circle_members');
  await knex.schema.dropTableIfExists('circles');
}
