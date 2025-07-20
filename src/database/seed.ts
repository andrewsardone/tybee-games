import { createDatabase } from './connection'
import * as schema from './schema'

export async function seedDatabase(db: ReturnType<typeof createDatabase>) {
  // Sample games data
  const sampleGames = [
    {
      id: 'settlers-of-catan',
      name: 'Settlers of Catan',
      description: 'A strategy game of trading, building, and settling',
      publisher: 'Catan Studio',
      year: 1995,
      minPlayers: 3,
      maxPlayers: 4,
      minDuration: 60,
      maxDuration: 90,
      complexityLevel: 3,
      strategyLuckRating: 4,
      themes: JSON.stringify(['strategy', 'trading', 'building']),
    },
    {
      id: 'ticket-to-ride',
      name: 'Ticket to Ride',
      description: 'A railway-themed board game about connecting cities',
      publisher: 'Days of Wonder',
      year: 2004,
      minPlayers: 2,
      maxPlayers: 5,
      minDuration: 30,
      maxDuration: 60,
      complexityLevel: 2,
      strategyLuckRating: 3,
      themes: JSON.stringify(['strategy', 'trains', 'collection']),
    },
    {
      id: 'azul',
      name: 'Azul',
      description: 'A tile-placement game inspired by Portuguese azulejos',
      publisher: 'Plan B Games',
      year: 2017,
      minPlayers: 2,
      maxPlayers: 4,
      minDuration: 30,
      maxDuration: 45,
      complexityLevel: 2,
      strategyLuckRating: 4,
      themes: JSON.stringify(['abstract', 'tile-placement', 'pattern-building']),
    },
    {
      id: 'wingspan',
      name: 'Wingspan',
      description: 'A beautiful engine-building game about birds',
      publisher: 'Stonemaier Games',
      year: 2019,
      minPlayers: 1,
      maxPlayers: 5,
      minDuration: 40,
      maxDuration: 70,
      complexityLevel: 3,
      strategyLuckRating: 3,
      themes: JSON.stringify(['engine-building', 'animals', 'cards']),
    },
    {
      id: 'codenames',
      name: 'Codenames',
      description: 'A word-based party game of clever clues and deduction',
      publisher: 'Czech Games Edition',
      year: 2015,
      minPlayers: 4,
      maxPlayers: 8,
      minDuration: 15,
      maxDuration: 30,
      complexityLevel: 1,
      strategyLuckRating: 2,
      themes: JSON.stringify(['party', 'word-game', 'deduction']),
    },
    {
      id: 'splendor',
      name: 'Splendor',
      description: 'A fast-paced and addictive game of chip-collecting and card development',
      publisher: 'Space Cowboys',
      year: 2014,
      minPlayers: 2,
      maxPlayers: 4,
      minDuration: 30,
      maxDuration: 30,
      complexityLevel: 2,
      strategyLuckRating: 4,
      themes: JSON.stringify(['engine-building', 'set-collection', 'renaissance']),
    }
  ]

  // Insert sample games
  await db.insert(schema.games).values(sampleGames)

  // Create multiple copies for popular games
  const gameCopiesData = [
    // Settlers of Catan - 2 copies
    { id: 'settlers-copy-1', gameId: 'settlers-of-catan', copyNumber: 1, location: 'Shelf A-1' },
    { id: 'settlers-copy-2', gameId: 'settlers-of-catan', copyNumber: 2, location: 'Shelf A-1' },

    // Ticket to Ride - 2 copies
    { id: 'ticket-copy-1', gameId: 'ticket-to-ride', copyNumber: 1, location: 'Shelf A-2' },
    { id: 'ticket-copy-2', gameId: 'ticket-to-ride', copyNumber: 2, location: 'Shelf A-2' },

    // Azul - 1 copy
    { id: 'azul-copy-1', gameId: 'azul', copyNumber: 1, location: 'Shelf B-1' },

    // Wingspan - 1 copy
    { id: 'wingspan-copy-1', gameId: 'wingspan', copyNumber: 1, location: 'Shelf B-2' },

    // Codenames - 3 copies (popular party game)
    { id: 'codenames-copy-1', gameId: 'codenames', copyNumber: 1, location: 'Shelf C-1' },
    { id: 'codenames-copy-2', gameId: 'codenames', copyNumber: 2, location: 'Shelf C-1' },
    { id: 'codenames-copy-3', gameId: 'codenames', copyNumber: 3, location: 'Shelf C-1' },

    // Splendor - 1 copy
    { id: 'splendor-copy-1', gameId: 'splendor', copyNumber: 1, location: 'Shelf B-3' },
  ]

  await db.insert(schema.gameCopies).values(gameCopiesData)

  // Create a sample staff user (you'll need to replace with actual Google IDs)
  const sampleStaff = [
    {
      id: 'staff-1',
      googleId: 'sample-google-id',
      email: 'staff@poolturtle.com',
      name: 'Sample Staff Member',
      role: 'admin' as const,
    }
  ]

  await db.insert(schema.staffUsers).values(sampleStaff)

  console.log('Database seeded successfully!')
}
