ALTER TABLE `users` MODIFY COLUMN `role` enum('Admin','AdminOPD','Verifikator') NOT NULL DEFAULT 'AdminOPD';--> statement-breakpoint
ALTER TABLE `usulan_dokumen` ADD `drive_file_id` varchar(100);