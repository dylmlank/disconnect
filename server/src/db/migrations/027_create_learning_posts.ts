import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Learning posts table
  await knex.schema.createTable('learning_posts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('author_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('post_type', ['learned', 'practicing', 'question', 'building']).notNullable();
    table.string('title', 200).notNullable();
    table.text('content').nullable();
    table.string('resource_url', 500).nullable();
    table.string('resource_title', 200).nullable();
    table.boolean('is_ai_assisted').notNullable().defaultTo(false);
    table.float('ai_detection_score').nullable(); // 0-1 confidence
    table.jsonb('ai_detection_flags').notNullable().defaultTo('[]');
    table.boolean('is_public').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Learning post to skills association
  await knex.schema.createTable('learning_post_skills', (table) => {
    table
      .uuid('post_id')
      .notNullable()
      .references('id')
      .inTable('learning_posts')
      .onDelete('CASCADE');
    table.uuid('skill_id').notNullable().references('id').inTable('skills').onDelete('CASCADE');
    table.primary(['post_id', 'skill_id']);
  });

  // Learning post to circles association (for non-public posts)
  await knex.schema.createTable('learning_post_circles', (table) => {
    table
      .uuid('post_id')
      .notNullable()
      .references('id')
      .inTable('learning_posts')
      .onDelete('CASCADE');
    table.uuid('circle_id').notNullable().references('id').inTable('circles').onDelete('CASCADE');
    table.primary(['post_id', 'circle_id']);
  });

  // Learning post comments
  await knex.schema.createTable('learning_post_comments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('post_id')
      .notNullable()
      .references('id')
      .inTable('learning_posts')
      .onDelete('CASCADE');
    table.uuid('author_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.boolean('is_ai_assisted').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Create indexes
  await knex.raw('CREATE INDEX idx_learning_posts_author ON learning_posts(author_id)');
  await knex.raw('CREATE INDEX idx_learning_posts_type ON learning_posts(post_type)');
  await knex.raw('CREATE INDEX idx_learning_posts_created ON learning_posts(created_at DESC)');
  await knex.raw('CREATE INDEX idx_learning_post_skills_skill ON learning_post_skills(skill_id)');
  await knex.raw('CREATE INDEX idx_learning_post_comments_post ON learning_post_comments(post_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('learning_post_comments');
  await knex.schema.dropTableIfExists('learning_post_circles');
  await knex.schema.dropTableIfExists('learning_post_skills');
  await knex.schema.dropTableIfExists('learning_posts');
}
