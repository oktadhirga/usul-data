CREATE TABLE `notifikasi` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`judul` varchar(255) NOT NULL,
	`pesan` text NOT NULL,
	`is_read` boolean NOT NULL DEFAULT false,
	`link` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifikasi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;