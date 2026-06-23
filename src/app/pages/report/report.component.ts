import { Component, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Chart, ChartType } from 'chart.js/auto';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { DomSanitizer } from '@angular/platform-browser';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../model/reservation';

@Component({
  selector: 'app-report',
  imports: [
    MatButtonModule,
    MatIconModule,
    PdfViewerModule,
  ],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css',
})
export class ReportComponent {

  private readonly reservationService = inject(ReservationService);
  private readonly sanitizer = inject(DomSanitizer);

  protected $reservations = toSignal(this.reservationService.findAll(), { initialValue: [] });

  protected $chart = signal<Chart>(null);
  protected $chartType = signal<ChartType>('bar');

  protected $pdfSrc = signal<string>(null);

  protected $filename = signal<string>(null);
  protected $selectedFiles = signal<FileList>(null);
  protected $imageData = signal<any>(null);
  protected $uploadedFileId = signal<number>(null);

  constructor() {
    effect(() => {
      const reservations = this.$reservations();
      const type = this.$chartType();

      if (reservations && reservations.length > 0) {
        const chartData = this.aggregateByRoomType(reservations);
        this.renderChart(chartData, type);
      }
    });
  }

  private aggregateByRoomType(reservations: Reservation[]): { label: string; count: number }[] {
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
      if (oldChart) {
        oldChart.destroy();
      }

      const labels = data.map(item => item.label);
      const quantities = data.map(item => item.count);

      const newChart = new Chart('canvas', {
        type,
        data: {
          labels,
          datasets: [
            {
              label: 'Reservations',
              data: quantities,
              borderColor: [
                'rgb(99, 179, 237)',
                'rgb(72, 187, 120)',
                'rgb(246, 173, 85)',
                'rgb(182, 120, 230)',
                'rgb(252, 129, 74)',
                'rgb(80, 213, 198)',
              ],
              fill: false,
              backgroundColor: [
                'rgba(99, 179, 237, 0.65)',
                'rgba(72, 187, 120, 0.65)',
                'rgba(246, 173, 85, 0.65)',
                'rgba(182, 120, 230, 0.65)',
                'rgba(252, 129, 74, 0.65)',
                'rgba(80, 213, 198, 0.65)',
              ],
              borderWidth: 2,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: 'rgba(255, 255, 255, 0.85)',
                font: { size: 13 },
              },
            },
          },
          scales: {
            x: {
              display: true,
              ticks: { color: 'rgba(255, 255, 255, 0.7)' },
              grid: { color: 'rgba(255, 255, 255, 0.08)' },
            },
            y: {
              display: true,
              beginAtZero: true,
              ticks: { stepSize: 1, color: 'rgba(255, 255, 255, 0.7)' },
              grid: { color: 'rgba(255, 255, 255, 0.08)' },
            },
          },
        },
      });

      this.$chart.set(newChart);
    });
  }

  change(type: ChartType) {
    this.$chartType.set(type);
  }

  viewReport() {
    this.reservationService.generateReport().subscribe(data => {
      const url = window.URL.createObjectURL(data);
      this.$pdfSrc.set(url);
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
    this.reservationService.readFile(id).subscribe(data => {
      this.convertToBase64(data);
    });
  }

  private convertToBase64(file: Blob) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64 = reader.result as string;
      this.$imageData.set(this.sanitizer.bypassSecurityTrustResourceUrl(base64));
    };
  }
}
