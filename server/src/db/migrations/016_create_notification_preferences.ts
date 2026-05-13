import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notification_preferences', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('event_reminders').notNullable().defaultTo(true);
    table.boolean('challenge_reminders').notNullable().defaultTo(true);
    table.boolean('circle_activity').notNullable().defaultTo(true);
    table.boolean('beacon_interest').notNullable().defaultTo(true);
    table.boolean('chat_messages').notNullable().defaultTo(true);
    table.string('habit_reminder_time', 5).nullable(); // HH:MM format, null = no reminder
    table.string('checkin_reminder_time', 5).nullable(); // HH:MM format
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notification_preferences');
}
