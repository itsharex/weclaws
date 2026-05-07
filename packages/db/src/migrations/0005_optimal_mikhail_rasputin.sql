CREATE TABLE `user_sandbox_runtime_pools` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`port` integer NOT NULL,
	`api_key` text NOT NULL,
	`workspace_base_path` text NOT NULL,
	`pool_size` integer NOT NULL,
	`min_ready_processes` integer NOT NULL,
	`session_timeout_ms` integer NOT NULL,
	`max_concurrent_init` integer NOT NULL,
	`health_check_interval_ms` integer NOT NULL,
	`port_range_start` integer NOT NULL,
	`port_range_end` integer NOT NULL,
	`default_denied_domains_json` text NOT NULL,
	`default_allow_read_json` text NOT NULL,
	`default_allow_write_json` text NOT NULL,
	`default_deny_read_json` text NOT NULL,
	`default_deny_write_json` text NOT NULL,
	`restart_requested_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_srt_pools_api_key_idx` ON `user_sandbox_runtime_pools` (`api_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_srt_pools_owner_user_idx` ON `user_sandbox_runtime_pools` (`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_srt_pools_port_idx` ON `user_sandbox_runtime_pools` (`port`);