CREATE TABLE `user_llm_configs` (
	`user_id` text PRIMARY KEY NOT NULL,
	`provider` text,
	`model` text,
	`api_key` text,
	`base_url` text,
	`api_type` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
