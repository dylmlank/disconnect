import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // User preferences for v3
  await knex.schema.createTable('user_preferences_v3', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.jsonb('goals').defaultTo('[]');
    table.jsonb('trigger_apps').defaultTo('[]');
    table.integer('estimated_daily_screen_time').defaultTo(3);
    table.jsonb('friction_settings').defaultTo('{}');
    table.timestamps(true, true);

    table.unique('user_id');
  });

  // Sessions for v3
  await knex.schema.createTable('sessions_v3', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('intent');
    table.integer('planned_duration');
    table.integer('actual_duration');
    table.enum('status', ['active', 'completed', 'cancelled']).defaultTo('active');
    table.timestamp('started_at').notNullable();
    table.timestamp('ended_at');
    table.text('notes');
    table.timestamps(true, true);

    table.index('user_id');
    table.index('status');
    table.index('started_at');
  });

  // Break attempts for v3
  await knex.schema.createTable('break_attempts_v3', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('app_name').notNullable();
    table
      .enum('trigger_type', ['impulse', 'notification', 'boredom', 'habit', 'other'])
      .notNullable();
    table.jsonb('friction_steps').defaultTo('[]');
    table.enum('outcome', ['continued', 'closed', 'timeout']).notNullable();
    table.uuid('session_id').references('id').inTable('sessions_v3').onDelete('SET NULL');
    table.timestamps(true, true);

    table.index('user_id');
    table.index('created_at');
  });

  // Check-ins for v3
  await knex.schema.createTable('check_ins_v3', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('session_id').references('id').inTable('sessions_v3').onDelete('SET NULL');
    table.enum('type', ['pre_session', 'post_session', 'scrolling_episode']).notNullable();
    table.enum('mood', ['great', 'good', 'meh', 'bad', 'awful']).notNullable();
    table.jsonb('data');
    table.timestamps(true, true);

    table.index('user_id');
    table.index('created_at');
  });

  // Add onboarding_completed column to users if it doesn't exist
  const hasColumn = await knex.schema.hasColumn('users', 'onboarding_completed');
  if (!hasColumn) {
    await knex.schema.alterTable('users', (table) => {
      table.boolean('onboarding_completed').defaultTo(false);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('check_ins_v3');
  await knex.schema.dropTableIfExists('break_attempts_v3');
  await knex.schema.dropTableIfExists('sessions_v3');
  await knex.schema.dropTableIfExists('user_preferences_v3');
}
