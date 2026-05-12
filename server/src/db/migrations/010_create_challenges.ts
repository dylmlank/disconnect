import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('challenges', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('creator_id').notNullable().references('id').inTable('users');
    table.uuid('circle_id').nullable().references('id').inTable('circles').onDelete('SET NULL');
    table.string('title', 100).notNullable();
    table.string('description', 500).nullable();
    table.integer('duration_days').notNullable();
    table.string('daily_requirement', 200).notNullable();
    table.string('category', 30).notNullable();
    table.string('research_note', 300).nullable();
    table.date('starts_at').notNullable();
    table.date('ends_at').notNullable();
    table.boolean('is_public').defaultTo(false);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Add location column for public/city-scoped challenges
  await knex.raw(`SELECT AddGeometryColumn('challenges', 'location', 4326, 'POINT', 2)`);

  await knex.schema.createTable('challenge_participants', (table) => {
    table.uuid('challenge_id').notNullable().references('id').inTable('challenges').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.timestamp('joined_at', { useTz: true }).defaultTo(knex.fn.now());
    table.boolean('completed').defaultTo(false);
    table.primary(['challenge_id', 'user_id']);
  });

  await knex.schema.createTable('challenge_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('challenge_id').notNullable().references('id').inTable('challenges').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.integer('day_number').notNullable();
    table.boolean('completed').notNullable().defaultTo(true);
    table.text('photo_url').nullable();
    table.timestamp('logged_at', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['challenge_id', 'user_id', 'day_number']);
  });

  await knex.schema.raw('CREATE INDEX idx_challenges_public ON challenges(is_public, starts_at) WHERE is_public = true');
  await knex.schema.raw('CREATE INDEX idx_challenges_circle ON challenges(circle_id)');
  await knex.schema.raw('CREATE INDEX idx_challenge_logs_lookup ON challenge_logs(challenge_id, user_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('challenge_logs');
  await knex.schema.dropTableIfExists('challenge_participants');
  await knex.schema.dropTableIfExists('challenges');
}
