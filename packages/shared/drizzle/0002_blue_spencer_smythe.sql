CREATE TABLE `usulan_detail_field` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`usulan_id` bigint unsigned NOT NULL,
	`jenis_usulan` enum('tambah','ubah','hapus') NOT NULL,
	`kategori_ubah` enum('Data Pribadi','Data Keluarga','Golongan','Jabatan','Pendidikan','Pindah Instansi','Diklat/Kursus') NOT NULL,
	`field_name` varchar(255) NOT NULL,
	`nilai_lama` text,
	`nilai_baru` text,
	CONSTRAINT `usulan_detail_field_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usulan_dokumen` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`usulan_id` bigint unsigned NOT NULL,
	`nama_dokumen` varchar(255) NOT NULL,
	`path_file` varchar(500) NOT NULL,
	`tipe_dokumen` varchar(100) NOT NULL,
	`ukuran_bytes` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usulan_dokumen_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usulan_perubahan` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`pegawai_id` bigint unsigned NOT NULL,
	`kode_unor` varchar(100) NOT NULL,
	`status` enum('draft','diajukan','dibatalkan','disetujui','ditolak') NOT NULL DEFAULT 'draft',
	`catatan` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usulan_perubahan_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `usulan_detail_field` ADD CONSTRAINT `usulan_detail_field_usulan_id_usulan_perubahan_id_fk` FOREIGN KEY (`usulan_id`) REFERENCES `usulan_perubahan`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `usulan_dokumen` ADD CONSTRAINT `usulan_dokumen_usulan_id_usulan_perubahan_id_fk` FOREIGN KEY (`usulan_id`) REFERENCES `usulan_perubahan`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `usulan_perubahan` ADD CONSTRAINT `usulan_perubahan_pegawai_id_pegawai_id_fk` FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `usulan_perubahan` ADD CONSTRAINT `usulan_perubahan_kode_unor_unor_kode_unor_fk` FOREIGN KEY (`kode_unor`) REFERENCES `unor`(`kode_unor`) ON DELETE cascade ON UPDATE cascade;