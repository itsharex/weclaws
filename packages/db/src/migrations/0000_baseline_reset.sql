CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_account_idx` ON `accounts` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `accounts_user_id_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `bot_events` (
	`id` text PRIMARY KEY NOT NULL,
	`bot_instance_id` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`payload_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bot_instance_id`) REFERENCES `bot_instances`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bot_events_bot_instance_created_at_idx` ON `bot_events` (`bot_instance_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `bot_instances` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`desired_state` text NOT NULL,
	`status` text NOT NULL,
	`process_pid` integer,
	`process_started_at` integer,
	`heartbeat_at` integer,
	`restart_count` integer DEFAULT 0 NOT NULL,
	`restart_backoff_until` integer,
	`restart_requested_at` integer,
	`last_qr_code_id` text,
	`last_qr_code_url` text,
	`weixin_account_id` text,
	`last_error_code` text,
	`last_error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bot_instances_owner_user_idx` ON `bot_instances` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `bot_instances_desired_state_status_idx` ON `bot_instances` (`desired_state`,`status`);--> statement-breakpoint
CREATE INDEX `bot_instances_restart_backoff_idx` ON `bot_instances` (`restart_backoff_until`);--> statement-breakpoint
CREATE TABLE `registration_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`reservation_token` text,
	`reserved_at` integer,
	`reserved_by_email` text,
	`used_by_user_id` text,
	`used_at` integer,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`used_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registration_invites_code_idx` ON `registration_invites` (`code`);--> statement-breakpoint
CREATE INDEX `registration_invites_created_at_idx` ON `registration_invites` ("created_at" desc,"id" desc);--> statement-breakpoint
CREATE INDEX `registration_invites_created_by_user_idx` ON `registration_invites` (`created_by_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `registration_invites_reservation_token_idx` ON `registration_invites` (`reservation_token`);--> statement-breakpoint
CREATE INDEX `registration_invites_reserved_at_idx` ON `registration_invites` (`reserved_at`);--> statement-breakpoint
CREATE INDEX `registration_invites_used_by_user_idx` ON `registration_invites` (`used_by_user_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_idx` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
