import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('nudges', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('from_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('to_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('circle_id').notNullable().references('id').inTable('circles').onDelete('CASCADE');
    table.string('message', 100).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Index for cooldown checks (from -> to, recent)
    table.index(['from_user_id', 'to_user_id', 'created_at']);
    // Index for fetching nudges sent to a user
    table.index(['to_user_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('nudges');
}
