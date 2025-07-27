DROP TABLE `games`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_checkout_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`checkout_date` text NOT NULL,
	`duration_minutes` integer,
	`returned` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
INSERT INTO `__new_checkout_analytics`("id", "game_id", "checkout_date", "duration_minutes", "returned", "created_at") SELECT "id", "game_id", "checkout_date", "duration_minutes", "returned", "created_at" FROM `checkout_analytics`;--> statement-breakpoint
DROP TABLE `checkout_analytics`;--> statement-breakpoint
ALTER TABLE `__new_checkout_analytics` RENAME TO `checkout_analytics`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_checkout_analytics_game_id` ON `checkout_analytics` (`game_id`);--> statement-breakpoint
CREATE INDEX `idx_checkout_analytics_date` ON `checkout_analytics` (`checkout_date`);--> statement-breakpoint
CREATE TABLE `__new_game_copies` (
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
	`notes` text
);
--> statement-breakpoint
INSERT INTO `__new_game_copies`("id", "game_id", "copy_number", "status", "condition", "location", "current_checkout_id", "last_checked_out", "total_checkouts", "date_added", "date_updated", "notes") SELECT "id", "game_id", "copy_number", "status", "condition", "location", "current_checkout_id", "last_checked_out", "total_checkouts", "date_added", "date_updated", "notes" FROM `game_copies`;--> statement-breakpoint
DROP TABLE `game_copies`;--> statement-breakpoint
ALTER TABLE `__new_game_copies` RENAME TO `game_copies`;--> statement-breakpoint
CREATE INDEX `idx_game_copies_game_id` ON `game_copies` (`game_id`);--> statement-breakpoint
CREATE INDEX `idx_game_copies_status` ON `game_copies` (`status`);--> statement-breakpoint
CREATE INDEX `idx_game_copies_available` ON `game_copies` (`game_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_game_copies_unique` ON `game_copies` (`game_id`,`copy_number`);