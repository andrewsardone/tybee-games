import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Games catalog (master game information)
export const games = sqliteTable(
  'games',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    publisher: text('publisher'),
    year: integer('year'),
    imageUrl: text('image_url'),
    minPlayers: integer('min_players').notNull(),
    maxPlayers: integer('max_players').notNull(),
    minDuration: integer('min_duration').notNull(), // minutes
    maxDuration: integer('max_duration').notNull(), // minutes
    complexityLevel: integer('complexity_level').notNull(), // 1-5 (1 = easy, 5 = complex)
    strategyLuckRating: integer('strategy_luck_rating').notNull(), // 1-5 (1 = luck, 5 = strategy)
    themes: text('themes'), // JSON array of theme strings
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    dateAdded: text('date_added').default(sql`CURRENT_TIMESTAMP`),
    dateUpdated: text('date_updated').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    activeIdx: index('idx_games_active').on(table.isActive),
    playersIdx: index('idx_games_players').on(
      table.minPlayers,
      table.maxPlayers
    ),
    durationIdx: index('idx_games_duration').on(
      table.minDuration,
      table.maxDuration
    ),
    complexityIdx: index('idx_games_complexity').on(table.complexityLevel),
    strategyLuckIdx: index('idx_games_strategy_luck').on(
      table.strategyLuckRating
    ),
  })
);

// Physical game copies (multiple copies per game)
export const gameCopies = sqliteTable(
  'game_copies',
  {
    id: text('id').primaryKey(),
    gameId: text('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    copyNumber: integer('copy_number').notNull(),
    status: text('status', {
      enum: ['available', 'checked_out', 'maintenance', 'missing'],
    })
      .notNull()
      .default('available'),
    condition: text('condition', {
      enum: ['excellent', 'good', 'fair', 'poor'],
    })
      .notNull()
      .default('excellent'),
    location: text('location'),
    currentCheckoutId: text('current_checkout_id'),
    lastCheckedOut: text('last_checked_out'),
    totalCheckouts: integer('total_checkouts').default(0),
    dateAdded: text('date_added').default(sql`CURRENT_TIMESTAMP`),
    dateUpdated: text('date_updated').default(sql`CURRENT_TIMESTAMP`),
    notes: text('notes'),
  },
  (table) => ({
    gameIdIdx: index('idx_game_copies_game_id').on(table.gameId),
    statusIdx: index('idx_game_copies_status').on(table.status),
    availableIdx: index('idx_game_copies_available').on(
      table.gameId,
      table.status
    ),
    uniqueGameCopy: index('idx_game_copies_unique').on(
      table.gameId,
      table.copyNumber
    ),
  })
);

// Checkout tracking
export const checkouts = sqliteTable(
  'checkouts',
  {
    id: text('id').primaryKey(),
    gameCopyId: text('game_copy_id')
      .notNull()
      .references(() => gameCopies.id, { onDelete: 'cascade' }),
    customerName: text('customer_name').notNull(), // Required for accountability
    checkedOutAt: text('checked_out_at').default(sql`CURRENT_TIMESTAMP`),
    expectedReturnAt: text('expected_return_at'),
    returnedAt: text('returned_at'),
    status: text('status', { enum: ['active', 'returned', 'overdue'] })
      .notNull()
      .default('active'),
    staffMemberId: text('staff_member_id').references(() => staffUsers.id),
    dateUpdated: text('date_updated').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    gameCopyIdIdx: index('idx_checkouts_game_copy_id').on(table.gameCopyId),
    statusIdx: index('idx_checkouts_status').on(table.status),
    activeIdx: index('idx_checkouts_active').on(table.status),
    dateIdx: index('idx_checkouts_date').on(table.checkedOutAt),
  })
);

// Staff authentication
export const staffUsers = sqliteTable(
  'staff_users',
  {
    id: text('id').primaryKey(),
    googleId: text('google_id').unique(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: text('role', { enum: ['staff', 'admin', 'manager'] }).default(
      'staff'
    ),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    lastLogin: text('last_login'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    emailIdx: index('idx_staff_users_email').on(table.email),
    googleIdIdx: index('idx_staff_users_google_id').on(table.googleId),
    activeIdx: index('idx_staff_users_active').on(table.isActive),
  })
);

// Anonymized checkout analytics (customer names removed)
export const checkoutAnalytics = sqliteTable(
  'checkout_analytics',
  {
    id: text('id').primaryKey(),
    gameId: text('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    checkoutDate: text('checkout_date').notNull(), // Day only, no time for privacy
    durationMinutes: integer('duration_minutes'), // How long game was out
    returned: integer('returned', { mode: 'boolean' }).notNull(), // Whether it was returned or went missing
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    gameIdIdx: index('idx_checkout_analytics_game_id').on(table.gameId),
    dateIdx: index('idx_checkout_analytics_date').on(table.checkoutDate),
  })
);

// Type exports for use throughout the application
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;

export type GameCopy = typeof gameCopies.$inferSelect;
export type NewGameCopy = typeof gameCopies.$inferInsert;

export type Checkout = typeof checkouts.$inferSelect;
export type NewCheckout = typeof checkouts.$inferInsert;

export type StaffUser = typeof staffUsers.$inferSelect;
export type NewStaffUser = typeof staffUsers.$inferInsert;

export type CheckoutAnalytic = typeof checkoutAnalytics.$inferSelect;
export type NewCheckoutAnalytic = typeof checkoutAnalytics.$inferInsert;
