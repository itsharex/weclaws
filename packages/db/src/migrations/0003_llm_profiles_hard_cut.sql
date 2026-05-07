CREATE TABLE `user_llm_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`api_key` text NOT NULL,
	`base_url` text,
	`api_type` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_llm_profiles_user_name_idx` ON `user_llm_profiles` (`user_id`,`name`);--> statement-breakpoint
ALTER TABLE `bot_instances` ADD `llm_config_id` text REFERENCES user_llm_profiles(id);