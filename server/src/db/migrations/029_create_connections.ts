import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Connection requests (intentional, context-aware friend requests)
  await knex.schema.createTable('connection_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('requester_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('target_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('context_type', ['skill', 'circle', 'event', 'resource']).notNullable();
    table.uuid('context_id').nullable(); // skill/circle/event/resource id
    table.text('message').nullable(); // optional intro message
    table
      .enum('status', ['pending', 'accepted', 'declined', 'ignored'])
      .notNullable()
      .defaultTo('pending');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('responded_at', { useTz: true }).nullable();
    table.unique(['requester_id', 'target_id']);
  });

  // Connections (accepted requests become mutual connections)
  await knex.schema.createTable('connections', (table) => {
    table.uuid('user_id_1').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('user_id_2').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('connected_at', { useTz: true }).defaultTo(knex.fn.now());
    table.primary(['user_id_1', 'user_id_2']);
    table.check('user_id_1 < user_id_2', [], 'connections_ordered_check');
  });

  // Update circles table to support skill-based groups
  await knex.schema.alterTable('circles', (table) => {
    table.text('description').nullable();
    table.boolean('is_public').notNullable().defaultTo(true);
    table.integer('max_members').notNullable().defaultTo(50);
  });

  // Circle skills association
  await knex.schema.createTable('circle_skills', (table) => {
    table.uuid('circle_id').notNullable().references('id').inTable('circles').onDelete('CASCADE');
    table.uuid('skill_id').notNullable().references('id').inTable('skills').onDelete('CASCADE');
    table.primary(['circle_id', 'skill_id']);
  });

  // Update events table to support learning events
  await knex.schema.alterTable('events', (table) => {
    table.boolean('is_workshop').notNullable().defaultTo(false);
  });

  // Event skills association
  await knex.schema.createTable('event_skills', (table) => {
    table.uuid('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
    table.uuid('skill_id').notNullable().references('id').inTable('skills').onDelete('CASCADE');
    table.primary(['event_id', 'skill_id']);
  });

  // Create indexes
  await knex.raw(
    'CREATE INDEX idx_connection_requests_target ON connection_requests(target_id, status)',
  );
  await knex.raw(
    'CREATE INDEX idx_connection_requests_requester ON connection_requests(requester_id, status)',
  );
  await knex.raw('CREATE INDEX idx_connections_user ON connections(user_id_1)');
  await knex.raw('CREATE INDEX idx_connections_user2 ON connections(user_id_2)');
  await knex.raw('CREATE INDEX idx_circle_skills_skill ON circle_skills(skill_id)');
  await knex.raw('CREATE INDEX idx_event_skills_skill ON event_skills(skill_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('event_skills');
  await knex.schema.dropTableIfExists('circle_skills');
  await knex.schema.dropTableIfExists('connections');
  await knex.schema.dropTableIfExists('connection_requests');

  // Revert events table changes
  await knex.schema.alterTable('events', (table) => {
    table.dropColumn('is_workshop');
  });

  // Revert circles table changes
  await knex.schema.alterTable('circles', (table) => {
    table.dropColumn('description');
    table.dropColumn('is_public');
    table.dropColumn('max_members');
  });
}
