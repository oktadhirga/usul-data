import {
  db,
  usulanPerubahan,
  usulanDetailField,
  pegawai,
  unor,
  eq,
  and,
  desc,
  sql,
  type UsulanStatus,
  type KategoriUbah
} from '@usul-data/shared';
import ExcelJS from 'exceljs';

export interface DashboardFilterParams {
  tahun?: number | null;
  bulan?: number | null;
  kodeUnor?: string | null;
  scopeUnor?: string | null;
  status?: UsulanStatus | null;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface UnorStatItem {
  kodeUnor: string;
  namaUnor: string;
  total: number;
  diajukan: number;
  disetujui: number;
  ditolak: number;
  draft: number;
  dibatalkan: number;
}

export interface KategoriStatItem {
  kategori: string;
  count: number;
}

export interface MonthlyStatItem {
  bulan: number;
  namaBulan: string;
  total: number;
  diajukan: number;
  disetujui: number;
  ditolak: number;
}

export interface DashboardStatsResponse {
  summary: {
    total: number;
    diajukan: number;
    disetujui: number;
    ditolak: number;
    draft: number;
    dibatalkan: number;
  };
  byStatus: StatusCount[];
  byUnor: UnorStatItem[];
  byKategori: KategoriStatItem[];
  monthlyTrend: MonthlyStatItem[];
  filteredPeriod: {
    tahun: number | null;
    bulan: number | null;
  };
}

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export class DashboardService {
  static async getStats(params: DashboardFilterParams): Promise<DashboardStatsResponse> {
    const effectiveKodeUnor = params.scopeUnor || params.kodeUnor || null;
    const conditions = [];

    if (effectiveKodeUnor) {
      conditions.push(eq(usulanPerubahan.kodeUnor, effectiveKodeUnor));
    }

    if (params.tahun) {
      conditions.push(sql`YEAR(${usulanPerubahan.createdAt}) = ${params.tahun}`);
    }

    if (params.bulan) {
      conditions.push(sql`MONTH(${usulanPerubahan.createdAt}) = ${params.bulan}`);
    }

    if (params.status) {
      conditions.push(eq(usulanPerubahan.status, params.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Ambil summary per status
    const statusCountsRaw = await db
      .select({
        status: usulanPerubahan.status,
        count: sql<number>`count(*)`.as('count')
      })
      .from(usulanPerubahan)
      .where(whereClause)
      .groupBy(usulanPerubahan.status);

    const summaryMap: Record<string, number> = {
      draft: 0,
      diajukan: 0,
      dibatalkan: 0,
      disetujui: 0,
      ditolak: 0
    };

    let total = 0;
    for (const row of statusCountsRaw) {
      const c = Number(row.count) || 0;
      summaryMap[row.status] = c;
      total += c;
    }

    const summary = {
      total,
      diajukan: summaryMap['diajukan'] || 0,
      disetujui: summaryMap['disetujui'] || 0,
      ditolak: summaryMap['ditolak'] || 0,
      draft: summaryMap['draft'] || 0,
      dibatalkan: summaryMap['dibatalkan'] || 0
    };

    const byStatus: StatusCount[] = [
      { status: 'diajukan', count: summary.diajukan },
      { status: 'disetujui', count: summary.disetujui },
      { status: 'ditolak', count: summary.ditolak },
      { status: 'draft', count: summary.draft },
      { status: 'dibatalkan', count: summary.dibatalkan }
    ];

    // 2. Statistik per UNOR
    const unorStatsRaw = await db
      .select({
        kodeUnor: usulanPerubahan.kodeUnor,
        namaUnor: unor.namaUnor,
        total: sql<number>`count(*)`.as('total'),
        diajukan: sql<number>`sum(case when ${usulanPerubahan.status} = 'diajukan' then 1 else 0 end)`.as('diajukan'),
        disetujui: sql<number>`sum(case when ${usulanPerubahan.status} = 'disetujui' then 1 else 0 end)`.as('disetujui'),
        ditolak: sql<number>`sum(case when ${usulanPerubahan.status} = 'ditolak' then 1 else 0 end)`.as('ditolak'),
        draft: sql<number>`sum(case when ${usulanPerubahan.status} = 'draft' then 1 else 0 end)`.as('draft'),
        dibatalkan: sql<number>`sum(case when ${usulanPerubahan.status} = 'dibatalkan' then 1 else 0 end)`.as('dibatalkan')
      })
      .from(usulanPerubahan)
      .leftJoin(unor, eq(usulanPerubahan.kodeUnor, unor.kodeUnor))
      .where(whereClause)
      .groupBy(usulanPerubahan.kodeUnor, unor.namaUnor)
      .orderBy(sql`total desc`);

    const byUnor: UnorStatItem[] = unorStatsRaw.map((r) => ({
      kodeUnor: r.kodeUnor,
      namaUnor: r.namaUnor || r.kodeUnor,
      total: Number(r.total) || 0,
      diajukan: Number(r.diajukan) || 0,
      disetujui: Number(r.disetujui) || 0,
      ditolak: Number(r.ditolak) || 0,
      draft: Number(r.draft) || 0,
      dibatalkan: Number(r.dibatalkan) || 0
    }));

    // 3. Statistik per Kategori Ubah
    const kategoriStatsRaw = await db
      .select({
        kategori: usulanDetailField.kategoriUbah,
        count: sql<number>`count(distinct ${usulanPerubahan.id})`.as('count')
      })
      .from(usulanDetailField)
      .innerJoin(usulanPerubahan, eq(usulanDetailField.usulanId, usulanPerubahan.id))
      .where(whereClause)
      .groupBy(usulanDetailField.kategoriUbah)
      .orderBy(sql`count desc`);

    const byKategori: KategoriStatItem[] = kategoriStatsRaw.map((r) => ({
      kategori: r.kategori,
      count: Number(r.count) || 0
    }));

    // 4. Tren Bulanan (berdasarkan tahun yang dipilih atau tahun saat ini)
    const targetYear = params.tahun || new Date().getFullYear();
    const monthlyConditions = [];
    if (effectiveKodeUnor) {
      monthlyConditions.push(eq(usulanPerubahan.kodeUnor, effectiveKodeUnor));
    }
    monthlyConditions.push(sql`YEAR(${usulanPerubahan.createdAt}) = ${targetYear}`);

    const monthlyRaw = await db
      .select({
        bulan: sql<number>`MONTH(${usulanPerubahan.createdAt})`.as('bulan'),
        total: sql<number>`count(*)`.as('total'),
        diajukan: sql<number>`sum(case when ${usulanPerubahan.status} = 'diajukan' then 1 else 0 end)`.as('diajukan'),
        disetujui: sql<number>`sum(case when ${usulanPerubahan.status} = 'disetujui' then 1 else 0 end)`.as('disetujui'),
        ditolak: sql<number>`sum(case when ${usulanPerubahan.status} = 'ditolak' then 1 else 0 end)`.as('ditolak')
      })
      .from(usulanPerubahan)
      .where(and(...monthlyConditions))
      .groupBy(sql`MONTH(${usulanPerubahan.createdAt})`);

    const monthlyMap = new Map<number, { total: number; diajukan: number; disetujui: number; ditolak: number }>();
    for (const r of monthlyRaw) {
      monthlyMap.set(Number(r.bulan), {
        total: Number(r.total) || 0,
        diajukan: Number(r.diajukan) || 0,
        disetujui: Number(r.disetujui) || 0,
        ditolak: Number(r.ditolak) || 0
      });
    }

    const monthlyTrend: MonthlyStatItem[] = [];
    for (let m = 1; m <= 12; m++) {
      const data = monthlyMap.get(m) || { total: 0, diajukan: 0, disetujui: 0, ditolak: 0 };
      monthlyTrend.push({
        bulan: m,
        namaBulan: BULAN_NAMES[m - 1],
        ...data
      });
    }

    return {
      summary,
      byStatus,
      byUnor,
      byKategori,
      monthlyTrend,
      filteredPeriod: {
        tahun: params.tahun ?? null,
        bulan: params.bulan ?? null
      }
    };
  }

  static async generateExcelReport(params: DashboardFilterParams): Promise<Buffer> {
    const effectiveKodeUnor = params.scopeUnor || params.kodeUnor || null;
    const conditions = [];

    if (effectiveKodeUnor) {
      conditions.push(eq(usulanPerubahan.kodeUnor, effectiveKodeUnor));
    }
    if (params.tahun) {
      conditions.push(sql`YEAR(${usulanPerubahan.createdAt}) = ${params.tahun}`);
    }
    if (params.bulan) {
      conditions.push(sql`MONTH(${usulanPerubahan.createdAt}) = ${params.bulan}`);
    }
    if (params.status) {
      conditions.push(eq(usulanPerubahan.status, params.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Ambil data usulan lengkap dengan relasi
    const rows = await db
      .select({
        id: usulanPerubahan.id,
        status: usulanPerubahan.status,
        catatan: usulanPerubahan.catatan,
        verifiedBy: usulanPerubahan.verifiedBy,
        verifiedAt: usulanPerubahan.verifiedAt,
        catatanVerifikasi: usulanPerubahan.catatanVerifikasi,
        createdAt: usulanPerubahan.createdAt,
        namaPegawai: pegawai.nama,
        nipPegawai: pegawai.nip,
        jabatanPegawai: pegawai.jabatan,
        namaUnor: unor.namaUnor,
        kodeUnor: usulanPerubahan.kodeUnor
      })
      .from(usulanPerubahan)
      .leftJoin(pegawai, eq(usulanPerubahan.pegawaiId, pegawai.id))
      .leftJoin(unor, eq(usulanPerubahan.kodeUnor, unor.kodeUnor))
      .where(whereClause)
      .orderBy(desc(usulanPerubahan.createdAt));

    // Ambil semua details untuk usulan yang ditemukan
    const usulanIds = rows.map((r) => r.id);
    let detailsByUsulan = new Map<number, string[]>();

    if (usulanIds.length > 0) {
      const details = await db
        .select({
          usulanId: usulanDetailField.usulanId,
          kategoriUbah: usulanDetailField.kategoriUbah,
          jenisUsulan: usulanDetailField.jenisUsulan,
          fieldName: usulanDetailField.fieldName
        })
        .from(usulanDetailField)
        .where(sql`${usulanDetailField.usulanId} in (${sql.raw(usulanIds.join(','))})`);

      for (const d of details) {
        const list = detailsByUsulan.get(d.usulanId) || [];
        const itemStr = `${d.kategoriUbah} (${d.jenisUsulan}: ${d.fieldName})`;
        if (!list.includes(itemStr)) {
          list.push(itemStr);
        }
        detailsByUsulan.set(d.usulanId, list);
      }
    }

    let unorLabel = 'Seluruh Unit Organisasi';
    if (effectiveKodeUnor) {
      const unorRecord = await db
        .select({ namaUnor: unor.namaUnor })
        .from(unor)
        .where(eq(unor.kodeUnor, effectiveKodeUnor))
        .limit(1);
      if (unorRecord[0]?.namaUnor) {
        unorLabel = `Unit: ${unorRecord[0].namaUnor}`;
      } else {
        unorLabel = 'Unit Organisasi Terpilih';
      }
    }
    const periodLabel = params.tahun
      ? `Periode: ${params.bulan ? BULAN_NAMES[params.bulan - 1] + ' ' : ''}${params.tahun}`
      : 'Semua Periode';

    return this.generateWorkbookFromData(rows, detailsByUsulan, {
      unorLabel,
      periodLabel
    });
  }

  static async generateWorkbookFromData(
    rows: any[],
    detailsByUsulan: Map<number, string[]>,
    options: {
      unorLabel?: string;
      periodLabel?: string;
    }
  ): Promise<Buffer> {
    // Inisialisasi Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistem Usul Data Kepegawaian';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Laporan Usulan', {
      views: [{ showGridLines: true }]
    });

    // Judul Dokumen di Baris Atas (11 Kolom: A - K)
    worksheet.mergeCells('A1:K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'LAPORAN USULAN PERUBAHAN DATA KEPEGAWAIAN';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate 800
    };
    worksheet.getRow(1).height = 32;

    // Subtitle Info Periode / UNOR (Tanpa Unor ID)
    worksheet.mergeCells('A2:K2');
    const subtitleCell = worksheet.getCell('A2');
    const unorLabel = options.unorLabel || 'Seluruh Unit Organisasi';
    const periodLabel = options.periodLabel || 'Semua Periode';
    subtitleCell.value = `${unorLabel} | ${periodLabel} | Dicetak: ${new Date().toLocaleDateString('id-ID')}`;
    subtitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    worksheet.addRow([]); // Blank line

    // Header Tabel (11 Kolom tanpa No. Usulan)
    const headers = [
      'No',
      'Tanggal Pengajuan',
      'NIP',
      'Nama Pegawai',
      'Jabatan',
      'Unit Organisasi',
      'Rincian Perubahan',
      'Status Usulan',
      'Catatan Pengusul',
      'Verifikator',
      'Catatan Verifikasi'
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4338CA' } // Indigo 700
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF1E1B4B' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    // Isi Data Baris
    rows.forEach((row, index) => {
      const createdDate = row.createdAt
        ? new Date(row.createdAt).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '-';

      const detailsList = detailsByUsulan.get(row.id) || [];
      const detailsText = detailsList.length > 0 ? detailsList.join('\n') : '-';

      const verifikasiText = row.verifiedBy
        ? `${row.verifiedBy} (${row.verifiedAt ? new Date(row.verifiedAt).toLocaleDateString('id-ID') : ''})`
        : '-';

      const dataRow = worksheet.addRow([
        index + 1,
        createdDate,
        row.nipPegawai || '-',
        row.namaPegawai || '-',
        row.jabatanPegawai || '-',
        row.namaUnor || '-',
        detailsText,
        row.status ? String(row.status).toUpperCase() : '-',
        row.catatan || '-',
        verifikasiText,
        row.catatanVerifikasi || '-'
      ]);

      dataRow.height = detailsList.length > 1 ? detailsList.length * 18 : 22;

      // Styling Data Cell
      const isEven = index % 2 === 0;
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: [1, 2, 3, 8].includes(colNumber) ? 'center' : 'left',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };

        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        }

        // Status badge styling (Kolom ke-8 adalah Status Usulan)
        if (colNumber === 8) {
          cell.font = { name: 'Calibri', size: 10, bold: true };
          if (row.status === 'disetujui') {
            cell.font = { ...cell.font, color: { argb: 'FF15803D' } }; // Green
          } else if (row.status === 'ditolak') {
            cell.font = { ...cell.font, color: { argb: 'FFB91C1C' } }; // Red
          } else if (row.status === 'diajukan') {
            cell.font = { ...cell.font, color: { argb: 'FFB45309' } }; // Amber
          }
        }
      });
    });

    // Sesuaikan lebar kolom (11 Kolom)
    worksheet.columns = [
      { width: 6 },  // 1: No
      { width: 18 }, // 2: Tanggal Pengajuan
      { width: 22 }, // 3: NIP
      { width: 30 }, // 4: Nama Pegawai
      { width: 28 }, // 5: Jabatan
      { width: 34 }, // 6: Unit Organisasi
      { width: 36 }, // 7: Rincian Perubahan
      { width: 16 }, // 8: Status
      { width: 30 }, // 9: Catatan Pengusul
      { width: 24 }, // 10: Verifikator
      { width: 30 }  // 11: Catatan Verifikasi
    ];

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
