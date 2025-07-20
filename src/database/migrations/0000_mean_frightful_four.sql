CREATE TABLE `checkout_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`checkout_date` text NOT NULL,
	`duration_minutes` integer,
	`returned` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_checkout_analytics_game_id` ON `checkout_analytics` (`game_id`);--> statement-breakpoint
CREATE INDEX `idx_checkout_analytics_date` ON `checkout_analytics` (`checkout_date`);--> statement-breakpoint
CREATE TABLE `checkouts` (
	`id` text PRIMARY KEY NOT NULL,
	`game_copy_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`checked_out_at` text DEFAULT CURRENT_TIMESTAMP,
	`expected_return_at` text,
	`returned_at` text,
	`status` text DEFAULT 'active' NOT NULL,
	`staff_member_id` text,
	`date_updated` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`game_copy_id`) REFERENCES `game_copies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`staff_member_id`) REFERENCES `staff_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_checkouts_game_copy_id` ON `checkouts` (`game_copy_id`);--> statement-breakpoint
CREATE INDEX `idx_checkouts_status` ON `checkouts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_checkouts_active` ON `checkouts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_checkouts_date` ON `checkouts` (`checked_out_at`);--> statement-breakpoint
CREATE TABLE `game_copies` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`copy_number` integer NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`condition` text DEFAULT 'excellent' NOT NULL,
	`location` text,
	`current_checkout_id` text,
	`last_checked_out` text,
	`total_checkouts` integer DEFAULT 0,
	`date_added` text DEFAULT CURRENT_TIMESTAMP,
	`date_updated` text DEFAULT CURRENT_TIMESTAMP,
	`notes` text,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_game_copies_game_id` ON `game_copies` (`game_id`);--> statement-breakpoint
CREATE INDEX `idx_game_copies_status` ON `game_copies` (`status`);--> statement-breakpoint
CREATE INDEX `idx_game_copies_available` ON `game_copies` (`game_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_game_copies_unique` ON `game_copies` (`game_id`,`copy_number`);--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`publisher` text,
	`year` integer,
	`image_url` text,
	`min_players` integer NOT NULL,
	`max_players` integer NOT NULL,
	`min_duration` integer NOT NULL,
	`max_duration` integer NOT NULL,
	`complexity_level` integer NOT NULL,
	`strategy_luck_rating` integer NOT NULL,
	`themes` text,
	`is_active` integer DEFAULT true,
	`date_added` text DEFAULT CURRENT_TIMESTAMP,
	`date_updated` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_games_active` ON `games` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_games_players` ON `games` (`min_players`,`max_players`);--> statement-breakpoint
CREATE INDEX `idx_games_duration` ON `games` (`min_duration`,`max_duration`);--> statement-breakpoint
CREATE INDEX `idx_games_complexity` ON `games` (`complexity_level`);--> statement-breakpoint
CREATE INDEX `idx_games_strategy_luck` ON `games` (`strategy_luck_rating`);--> statement-breakpoint
CREATE TABLE `staff_users` (
	`id` text PRIMARY KEY NOT NULL,
	`google_id` text,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'staff',
	`is_active` integer DEFAULT true,
	`last_login` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_users_google_id_unique` ON `staff_users` (`google_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `staff_users_email_unique` ON `staff_users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_staff_users_email` ON `staff_users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_staff_users_google_id` ON `staff_users` (`google_id`);--> statement-breakpoint
CREATE INDEX `idx_staff_users_active` ON `staff_users` (`is_active`);