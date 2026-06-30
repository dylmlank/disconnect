import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Skills taxonomy table
  await knex.schema.createTable('skills', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable().unique();
    table.string('category', 50).notNullable();
    table.text('description').nullable();
    table.jsonb('aliases').notNullable().defaultTo('[]');
    table.jsonb('related_skill_ids').notNullable().defaultTo('[]');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // User skills (what users are learning/practicing/teaching)
  await knex.schema.createTable('user_skills', (table) => {
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('skill_id').notNullable().references('id').inTable('skills').onDelete('CASCADE');
    table.enum('level', ['learning', 'practicing', 'teaching']).notNullable();
    table.enum('visibility', ['public', 'circles', 'private']).notNullable().defaultTo('public');
    table.text('notes').nullable();
    table.timestamp('added_at', { useTz: true }).defaultTo(knex.fn.now());
    table.primary(['user_id', 'skill_id']);
  });

  // Create indexes
  await knex.raw('CREATE INDEX idx_skills_category ON skills(category)');
  await knex.raw('CREATE INDEX idx_skills_name_lower ON skills(lower(name))');
  await knex.raw('CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id)');
  await knex.raw('CREATE INDEX idx_user_skills_level ON user_skills(level)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_skills');
  await knex.schema.dropTableIfExists('skills');
}
