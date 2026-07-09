import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Chart, ChartType } from 'chart.js/auto';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { CurrencyPipe } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReservationService } from '../../services/reservation.service';
import { ReservationAdditionalServiceService } from '../../services/reservation-additional-service.service';
import { Reservation } from '../../model/reservation';
import { ReservationAdditionalService } from '../../model/reservation-additional-service';

interface ServiceStat {
  name: string;
  category: string;
  count: number;
  revenue: number;
}

interface ServiceStats {
  totalCount: number;
  totalRevenue: number;
  topServiceName: string;
  topCategoryLabel: string;
  revenueByCategory: { label: string; revenue: number }[];
  top5: ServiceStat[];
}

const CHART_COLORS = [
  'rgb(99, 179, 237)', 'rgb(72, 187, 120)', 'rgb(246, 173, 85)',
  'rgb(182, 120, 230)', 'rgb(252, 129, 74)', 'rgb(80, 213, 198)',
];
const CHART_BG = CHART_COLORS.map(c => c.replace('rgb', 'rgba').replace(')', ', 0.65)'));

const SERVICE_COLORS = [
  'rgb(246, 173, 85)', 'rgb(99, 179, 237)',
  'rgb(182, 120, 230)', 'rgb(158, 158, 158)',
];
const SERVICE_BG = SERVICE_COLORS.map(c => c.replace('rgb', 'rgba').replace(')', ', 0.65)'));

@Component({
  selector: 'app-report',
  imports: [
    MatButtonModule,
    MatIconModule,
    PdfViewerModule,
    CurrencyPipe,
  ],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css',
})
export class ReportComponent {

  private readonly reservationService = inject(ReservationService);
  private readonly rasService = inject(ReservationAdditionalServiceService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly categoryLabels: Record<string, string> = {
    FOOD: 'Comida',
    BEVERAGE: 'Bebida',
    PERSONAL_CARE: 'Cuidado Personal',
    OTHER: 'Otro',
  };

  // ── Reservations chart ──────────────────────────────────────────────────────
  protected $reservations = toSignal(this.reservationService.findAll());
  protected $chart = signal<Chart | null>(null);
  protected $chartType = signal<ChartType>('bar');

  // ── PDF ─────────────────────────────────────────────────────────────────────
  protected $pdfSrc = signal<string | null>(null);

  // ── File Manager ─────────────────────────────────────────────────────────────
  protected $filename = signal<string | null>(null);
  protected $selectedFiles = signal<FileList | null>(null);
  protected $imageData = signal<any>(null);
  protected $uploadedFileId = signal<number | null>(null);

  // ── Services analytics ───────────────────────────────────────────────────────
  protected $allReservationServices = toSignal(this.rasService.findAll());
  protected $loading = computed(() =>
    this.$reservations() === undefined || this.$allReservationServices() === undefined
  );
  protected $servicesChart = signal<Chart | null>(null);
  protected $servicesChartType = signal<ChartType>('doughnut');

  protected $serviceStats = computed<ServiceStats | null>(() => {
    const all = this.$allReservationServices();
    if (!all?.length) return null;

    const totalCount = all.length;
    const totalRevenue = all.reduce((acc, s) => acc + (s.totalPriceDto ?? 0), 0);

    const byName = new Map<string, ServiceStat>();
    for (const s of all) {
      const name = s.additionalService?.nameDto ?? 'Unknown';
      const category = s.additionalService?.categoryDto ?? 'OTHER';
      const entry = byName.get(name) ?? { name, category, count: 0, revenue: 0 };
      entry.count++;
      entry.revenue += s.totalPriceDto ?? 0;
      byName.set(name, entry);
    }

    let topServiceName = '';
    let topServiceCount = 0;
    for (const stat of byName.values()) {
      if (stat.count > topServiceCount) {
        topServiceCount = stat.count;
        topServiceName = stat.name;
      }
    }

    const revByCat = new Map<string, number>();
    for (const s of all) {
      const cat = s.additionalService?.categoryDto ?? 'OTHER';
      revByCat.set(cat, (revByCat.get(cat) ?? 0) + (s.totalPriceDto ?? 0));
    }

    let topCategoryKey = '';
    let topCategoryRevenue = 0;
    for (const [cat, rev] of revByCat) {
      if (rev > topCategoryRevenue) { topCategoryRevenue = rev; topCategoryKey = cat; }
    }

    const revenueByCategory = [...revByCat.entries()].map(([key, revenue]) => ({
      label: this.categoryLabels[key] ?? key,
      revenue,
    }));

    const top5 = [...byName.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
      totalCount,
      totalRevenue,
      topServiceName,
      topCategoryLabel: this.categoryLabels[topCategoryKey] ?? topCategoryKey,
      revenueByCategory,
      top5,
    };
  });

  constructor() {
    effect(() => {
      const reservations = this.$reservations();
      const type = this.$chartType();
      if (reservations?.length) {
        const chartData = this.aggregateByRoomType(reservations);
        this.renderChart(chartData, type);
      }
    });

    effect(() => {
      const stats = this.$serviceStats();
      const type = this.$servicesChartType();
      if (stats && stats.revenueByCategory.length > 0) {
        this.renderServicesChart(stats.revenueByCategory, type);
      }
    });
  }

  // ── Reservations chart ──────────────────────────────────────────────────────
  private aggregateByRoomType(reservations: Reservation[] | undefined): { label: string; count: number }[] {
    if (!reservations) return [];
    const counts: Record<string, number> = {};
    for (const r of reservations) {
      const type = r.room?.typeDto ?? 'Unknown';
      counts[type] = (counts[type] ?? 0) + 1;
    }
    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  }

  private renderChart(data: { label: string; count: number }[], type: ChartType) {
    untracked(() => {
      const oldChart = this.$chart();
      if (oldChart) oldChart.destroy();

      const newChart = new Chart('canvas', {
        type,
        data: {
          labels: data.map(d => d.label),
          datasets: [{
            label: 'Reservations',
            data: data.map(d => d.count),
            borderColor: CHART_COLORS,
            fill: false,
            backgroundColor: CHART_BG,
            borderWidth: 2,
          }],
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: 'rgba(255,255,255,0.85)', font: { size: 13 } } } },
          scales: {
            x: { display: true, ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.08)' } },
            y: { display: true, beginAtZero: true, ticks: { stepSize: 1, color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.08)' } },
          },
        },
      });

      this.$chart.set(newChart);
    });
  }

  change(type: ChartType) { this.$chartType.set(type); }

  // ── Services chart ───────────────────────────────────────────────────────────
  private renderServicesChart(data: { label: string; revenue: number }[], type: ChartType) {
    untracked(() => {
      const oldChart = this.$servicesChart();
      if (oldChart) oldChart.destroy();

      const newChart = new Chart('canvas-services', {
        type,
        data: {
          labels: data.map(d => d.label),
          datasets: [{
            label: 'Ingresos ($)',
            data: data.map(d => d.revenue),
            borderColor: SERVICE_COLORS,
            fill: false,
            backgroundColor: SERVICE_BG,
            borderWidth: 2,
          }],
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: 'rgba(255,255,255,0.85)', font: { size: 13 } } } },
          scales: {
            x: { display: true, ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.08)' } },
            y: { display: true, beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.08)' } },
          },
        },
      });

      this.$servicesChart.set(newChart);
    });
  }

  changeServicesChart(type: ChartType) { this.$servicesChartType.set(type); }

  // ── PDF ─────────────────────────────────────────────────────────────────────
  viewReport() {
    this.reservationService.generateReport().subscribe(data => {
      this.$pdfSrc.set(window.URL.createObjectURL(data));
    });
  }

  downloadReport() {
    this.reservationService.generateReport().subscribe(data => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.setAttribute('style', 'display:none;');
      document.body.appendChild(a);
      a.href = url;
      a.download = 'report.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    });
  }

  // ── File Manager ─────────────────────────────────────────────────────────────
  selectFile(e: any) {
    const file: File = e.target.files[0];
    this.$filename.set(file.name);
    this.$selectedFiles.set(e.target.files);
  }

  upload() {
    const files = this.$selectedFiles();
    if (files && files.length > 0) {
      this.reservationService.saveFile(files[0]).subscribe(id => {
        this.$uploadedFileId.set(id);
        alert(`Archivo subido satisfactoriamente con ID: ${id}`);
      });
    }
  }

  viewImage() {
    const id = this.$uploadedFileId();
    if (!id) {
      alert('Por favor, suba un archivo primero');
      return;
    }
    this.reservationService.readFile(id).subscribe(dataUrl => {
      // Solo confiar en data URLs de imágenes conocidas; evita XSS vía SVG/HTML.
      const allowed = /^data:image\/(png|jpeg|webp|gif);base64,/i;
      if (!allowed.test(dataUrl)) {
        alert('El archivo no es una imagen válida.');
        return;
      }
      this.$imageData.set(this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl));
    });
  }
}
