import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('vibes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('vibe', 20).notNullable(); // thriving, locked_in, meh, low_energy, struggling
    table.date('vibe_date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['user_id', 'vibe_date']);
  });

  await knex.schema.raw('CREATE INDEX idx_vibes_user_date ON vibes(user_id, vibe_date DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('vibes');
}
