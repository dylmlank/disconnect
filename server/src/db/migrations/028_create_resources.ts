import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Resources table (shared links, books, courses, etc.)
  await knex.schema.createTable('resources', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('uploader_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 200).notNullable();
    table.text('description').nullable();
    table.string('url', 500).notNullable();
    table
      .enum('resource_type', ['article', 'book', 'course', 'video', 'tool', 'other'])
      .notNullable();
    table.enum('cost', ['free', 'paid', 'freemium']).notNullable().defaultTo('free');
    table.integer('upvotes').notNullable().defaultTo(0);
    table.integer('downvotes').notNullable().defaultTo(0);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Resource to skills association
  await knex.schema.createTable('resource_skills', (table) => {
    table
      .uuid('resource_id')
      .notNullable()
      .references('id')
      .inTable('resources')
      .onDelete('CASCADE');
    table.uuid('skill_id').notNullable().references('id').inTable('skills').onDelete('CASCADE');
    table.primary(['resource_id', 'skill_id']);
  });

  // Resource votes (track user votes)
  await knex.schema.createTable('resource_votes', (table) => {
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table
      .uuid('resource_id')
      .notNullable()
      .references('id')
      .inTable('resources')
      .onDelete('CASCADE');
    table.enum('vote', ['up', 'down']).notNullable();
    table.timestamp('voted_at', { useTz: true }).defaultTo(knex.fn.now());
    table.primary(['user_id', 'resource_id']);
  });

  // Resource comments
  await knex.schema.createTable('resource_comments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('resource_id')
      .notNullable()
      .references('id')
      .inTable('resources')
      .onDelete('CASCADE');
    table.uuid('author_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // AI content flags (for any content type)
  await knex.schema.createTable('ai_content_flags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.enum('target_type', ['post', 'comment', 'resource']).notNullable();
    table.uuid('target_id').notNullable();
    table.enum('detection_method', ['user_reported', 'auto_pattern', 'auto_api']).notNullable();
    table.float('confidence').notNullable(); // 0-1
    table.jsonb('flags').notNullable().defaultTo('[]');
    table.timestamp('detected_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Create indexes
  await knex.raw('CREATE INDEX idx_resources_uploader ON resources(uploader_id)');
  await knex.raw('CREATE INDEX idx_resources_type ON resources(resource_type)');
  await knex.raw('CREATE INDEX idx_resource_skills_skill ON resource_skills(skill_id)');
  await knex.raw('CREATE INDEX idx_ai_flags_target ON ai_content_flags(target_type, target_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ai_content_flags');
  await knex.schema.dropTableIfExists('resource_comments');
  await knex.schema.dropTableIfExists('resource_votes');
  await knex.schema.dropTableIfExists('resource_skills');
  await knex.schema.dropTableIfExists('resources');
}
