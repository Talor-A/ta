CREATE TABLE `blogPosts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`publishedDate` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blogPosts_slug_unique` ON `blogPosts` (`slug`);