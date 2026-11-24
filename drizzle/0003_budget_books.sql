CREATE TABLE `budget_books` (
	`user_id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`book` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
