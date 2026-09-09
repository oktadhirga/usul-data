CREATE TABLE `pegawai` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`nip` varchar(50) NOT NULL,
	`nama` varchar(255) NOT NULL,
	`jabatan` varchar(255) NOT NULL,
	`kode_unor` varchar(100) NOT NULL,
	CONSTRAINT `pegawai_id` PRIMARY KEY(`id`),
	CONSTRAINT `pegawai_nip_unique` UNIQUE(`nip`)
);
--> statement-breakpoint
CREATE TABLE `unor` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`kode_unor` varchar(100) NOT NULL,
	`nama_unor` varchar(255) NOT NULL,
	CONSTRAINT `unor_id` PRIMARY KEY(`id`),
	CONSTRAINT `unor_kode_unor_unique` UNIQUE(`kode_unor`)
);
--> statement-breakpoint
ALTER TABLE `pegawai` ADD CONSTRAINT `pegawai_kode_unor_unor_kode_unor_fk` FOREIGN KEY (`kode_unor`) REFERENCES `unor`(`kode_unor`) ON DELETE cascade ON UPDATE cascade;