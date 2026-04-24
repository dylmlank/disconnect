import { db } from '../config/database';

export interface UserRow {
  id: string;
  clerk_id: string;
  phone_hash: string | null;
  first_name: string;
  date_of_birth: string;
  bio: string | null;
  interests: string[];
  photo_url: string | null;
  is_minor: boolean;
  device_token: string | null;
  approximate_location: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function findUserById(id: string): Promise<UserRow | undefined> {
  return db('users').where('id', id).first();
}

export async function findUserByClerkId(clerkId: string): Promise<UserRow | undefined> {
  return db('users').where('clerk_id', clerkId).first();
}

export async function createUser(data: {
  clerkId: string;
  firstName: string;
  dateOfBirth: string;
  bio?: string;
  interests: string[];
}): Promise<UserRow> {
  const dob = new Date(data.dateOfBirth);
  const now = new Date();
  const age = now.getFullYear() - dob.getFullYear();
  const isMinor = age < 18 || (age === 18 && now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()));

  const [user] = await db('users')
    .insert({
      clerk_id: data.clerkId,
      first_name: data.firstName,
      date_of_birth: data.dateOfBirth,
      bio: data.bio || null,
      interests: data.interests,
      is_minor: isMinor,
    })
    .returning('*');

  return user;
}

export async function updateUser(
  id: string,
  data: Partial<{
    first_name: string;
    bio: string;
    interests: string[];
    photo_url: string;
    device_token: string;
  }>,
): Promise<UserRow> {
  const [user] = await db('users')
    .where('id', id)
    .update({ ...data, updated_at: db.fn.now() })
    .returning('*');

  return user;
}

export async function updateUserLocation(id: string, lat: number, lng: number): Promise<void> {
  await db.raw(
    `UPDATE users SET approximate_location = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?`,
    [lng, lat, id],
  );
}

export function toUserProfile(row: UserRow) {
  return {
    id: row.id,
    firstName: row.first_name,
    bio: row.bio,
    interests: row.interests,
    photoUrl: row.photo_url,
    isMinor: row.is_minor,
  };
}

export function toUser(row: UserRow) {
  return {
    id: row.id,
    firstName: row.first_name,
    dateOfBirth: row.date_of_birth,
    bio: row.bio,
    interests: row.interests,
    photoUrl: row.photo_url,
    isMinor: row.is_minor,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
