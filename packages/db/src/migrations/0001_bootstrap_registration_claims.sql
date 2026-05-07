CREATE TABLE `registration_bootstrap_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`claim_token` text,
	`claimed_by_email` text,
	`claimed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registration_bootstrap_claims_token_idx` ON `registration_bootstrap_claims` (`claim_token`);--> statement-breakpoint
CREATE INDEX `registration_bootstrap_claims_claimed_at_idx` ON `registration_bootstrap_claims` (`claimed_at`);
