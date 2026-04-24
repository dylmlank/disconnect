import { Knex } from 'knex';

// Austin, TX area coordinates
const AUSTIN_CENTER = { lat: 30.2672, lng: -97.7431 };

function offsetCoord(baseLat: number, baseLng: number, latOffset: number, lngOffset: number) {
  return { lat: baseLat + latOffset, lng: baseLng + lngOffset };
}

export async function seed(knex: Knex): Promise<void> {
  // Clean existing data in reverse FK order
  await knex('beacon_interests').del();
  await knex('event_rsvps').del();
  await knex('event_chat_messages').del();
  await knex('blocks').del();
  await knex('beacons').del();
  await knex('events').del();
  await knex('users').del();

  // --- Users ---
  const users = [
    {
      clerk_id: 'dev_user_alex',
      first_name: 'Alex',
      date_of_birth: '2001-03-15',
      bio: 'Less screen time, more green time',
      interests: ['hiking', 'photography', 'coffee'],
      is_minor: false,
    },
    {
      clerk_id: 'dev_user_jordan',
      first_name: 'Jordan',
      date_of_birth: '2000-08-22',
      bio: 'Looking for pickup basketball and trail runs',
      interests: ['basketball', 'running', 'cooking'],
      is_minor: false,
    },
    {
      clerk_id: 'dev_user_sam',
      first_name: 'Sam',
      date_of_birth: '2003-01-10',
      bio: 'Guitar player, coffee drinker, nature lover',
      interests: ['music', 'coffee', 'camping'],
      is_minor: false,
    },
    {
      clerk_id: 'dev_user_riley',
      first_name: 'Riley',
      date_of_birth: '2012-06-30',
      bio: 'Love art and board games!',
      interests: ['painting', 'board-games'],
      is_minor: true,
    },
    {
      clerk_id: 'dev_user_morgan',
      first_name: 'Morgan',
      date_of_birth: '1999-11-05',
      bio: 'Trying to touch grass more often',
      interests: ['yoga', 'gardening', 'meditation'],
      is_minor: false,
    },
    {
      clerk_id: 'dev_user_casey',
      first_name: 'Casey',
      date_of_birth: '2002-04-18',
      bio: 'Skater and film nerd going offline',
      interests: ['skateboarding', 'film', 'music'],
      is_minor: false,
    },
  ];

  const userRows = await knex('users').insert(users).returning('*');
  const userMap = Object.fromEntries(userRows.map((u: any) => [u.first_name, u.id]));

  // Set approximate locations for users around Austin
  const locations: Record<string, { lat: number; lng: number }> = {
    Alex: offsetCoord(AUSTIN_CENTER.lat, AUSTIN_CENTER.lng, 0.01, -0.005),
    Jordan: offsetCoord(AUSTIN_CENTER.lat, AUSTIN_CENTER.lng, -0.008, 0.01),
    Sam: offsetCoord(AUSTIN_CENTER.lat, AUSTIN_CENTER.lng, 0.015, 0.005),
    Riley: offsetCoord(AUSTIN_CENTER.lat, AUSTIN_CENTER.lng, 0.002, -0.012),
    Morgan: offsetCoord(AUSTIN_CENTER.lat, AUSTIN_CENTER.lng, -0.01, -0.008),
    Casey: offsetCoord(AUSTIN_CENTER.lat, AUSTIN_CENTER.lng, 0.005, 0.015),
  };

  for (const [name, loc] of Object.entries(locations)) {
    await knex.raw(`UPDATE users SET approximate_location = ST_SetSRID(ST_MakePoint(?, ?), 4326) WHERE id = ?`, [
      loc.lng,
      loc.lat,
      userMap[name],
    ]);
  }

  // --- Events (future dates, spread around Austin) ---
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const events = [
    {
      creator_id: userMap['Alex'],
      title: 'Barton Creek Trail Hike',
      description: 'Morning hike along the greenbelt. All levels welcome, bring water!',
      address: 'Barton Creek Greenbelt Trailhead, Austin TX',
      starts_at: new Date(tomorrow.setHours(8, 0, 0, 0)),
      category: 'outdoors',
      max_attendees: 12,
      all_ages: true,
      location: knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [-97.7703, 30.2611]),
    },
    {
      creator_id: userMap['Jordan'],
      title: 'Pickup Basketball @ Ramsey Park',
      description: 'Casual 3v3 or 5v5 depending on turnout. No skill level required.',
      address: 'Ramsey Park, 4301 Rosedale Ave, Austin TX',
      starts_at: new Date(tomorrow.setHours(17, 0, 0, 0)),
      category: 'sports',
      max_attendees: 10,
      all_ages: true,
      location: knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [-97.7389, 30.3075]),
    },
    {
      creator_id: userMap['Sam'],
      title: 'Open Mic Night Meetup',
      description: 'Grab coffee and watch local artists. Maybe play a song yourself?',
      address: 'Cenote Cafe, 1010 E Cesar Chavez, Austin TX',
      starts_at: new Date(dayAfter.setHours(19, 0, 0, 0)),
      category: 'music',
      max_attendees: 20,
      all_ages: false,
      location: knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [-97.7305, 30.2545]),
    },
    {
      creator_id: userMap['Morgan'],
      title: 'Sunday Morning Yoga in Zilker',
      description: 'Bring a mat and some good vibes. 45 min flow then hang out.',
      address: 'Zilker Park, Austin TX',
      starts_at: new Date(nextWeek.setHours(9, 0, 0, 0)),
      category: 'outdoors',
      max_attendees: 15,
      all_ages: true,
      location: knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [-97.773, 30.267]),
    },
    {
      creator_id: userMap['Casey'],
      title: 'Board Game Afternoon',
      description: 'Settlers, Codenames, whatever people bring. Snacks provided.',
      address: 'Epoch Coffee, 221 W North Loop, Austin TX',
      starts_at: new Date(dayAfter.setHours(14, 0, 0, 0)),
      category: 'games',
      max_attendees: 8,
      all_ages: true,
      location: knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [-97.7234, 30.3191]),
    },
    {
      creator_id: userMap['Alex'],
      title: 'Coffee & Sketch at Houndstooth',
      description: 'Bring a sketchbook or just come for the coffee and conversation.',
      address: 'Houndstooth Coffee, 401 Congress Ave, Austin TX',
      starts_at: new Date(nextWeek.setHours(10, 30, 0, 0)),
      category: 'creative',
      max_attendees: 10,
      all_ages: true,
      location: knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [-97.7441, 30.2672]),
    },
  ];

  const eventRows = await knex('events').insert(events).returning('*');

  // RSVPs — a few people signed up for events
  await knex('event_rsvps').insert([
    { event_id: eventRows[0].id, user_id: userMap['Morgan'] },
    { event_id: eventRows[0].id, user_id: userMap['Jordan'] },
    { event_id: eventRows[1].id, user_id: userMap['Alex'] },
    { event_id: eventRows[1].id, user_id: userMap['Casey'] },
    { event_id: eventRows[2].id, user_id: userMap['Alex'] },
    { event_id: eventRows[3].id, user_id: userMap['Alex'] },
    { event_id: eventRows[3].id, user_id: userMap['Sam'] },
    { event_id: eventRows[4].id, user_id: userMap['Riley'] },
    { event_id: eventRows[4].id, user_id: userMap['Sam'] },
  ]);

  // --- Beacons (active, expire in 2 hours from seed time) ---
  const beaconExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);

  const beacons = [
    {
      creator_id: userMap['Alex'],
      message: 'At the greenbelt trailhead, anyone want to hike?',
      activity: 'Hiking',
      place_name: 'Barton Creek Greenbelt',
      location: knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [-97.7703, 30.2611]),
      expires_at: beaconExpiry,
    },
    {
      creator_id: userMap['Jordan'],
      message: 'Shooting hoops solo, need more people!',
      activity: 'Basketball',
      place_name: 'Ramsey Park Courts',
      location: knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [-97.7389, 30.3075]),
      expires_at: beaconExpiry,
    },
    {
      creator_id: userMap['Sam'],
      message: 'Grabbing coffee and playing guitar at Cenote. Come hang!',
      activity: 'Coffee & Music',
      place_name: 'Cenote Cafe',
      location: knex.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)`, [-97.7305, 30.2545]),
      expires_at: beaconExpiry,
    },
  ];

  const beaconRows = await knex('beacons').insert(beacons).returning('*');

  // Beacon interests
  await knex('beacon_interests').insert([
    { beacon_id: beaconRows[0].id, user_id: userMap['Morgan'] },
    { beacon_id: beaconRows[0].id, user_id: userMap['Casey'] },
    { beacon_id: beaconRows[1].id, user_id: userMap['Alex'] },
    { beacon_id: beaconRows[2].id, user_id: userMap['Alex'] },
    { beacon_id: beaconRows[2].id, user_id: userMap['Morgan'] },
  ]);

  console.log('Seed data loaded:');
  console.log(`  ${userRows.length} users`);
  console.log(`  ${eventRows.length} events`);
  console.log(`  ${beaconRows.length} beacons`);
  console.log('\nTest login phone: +15125550001 (Alex) — verify code: 123456');
  console.log('Test login phone: +15125550004 (Riley, minor) — verify code: 123456');
}
