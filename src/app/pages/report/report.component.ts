import { Component, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConsultService } from '../../services/consult.service';
import { Chart, ChartType } from 'chart.js/auto';
import { MatButtonModule } from '@angular/material/button';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { MatDividerModule } from '@angular/material/divider';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-report',
  imports: [
    MatButtonModule,
    PdfViewerModule,
    MatDividerModule
  ],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css',
})
export class ReportComponent {

  private readonly consultSerice = inject(ConsultService);
  private readonly sanitizer = inject(DomSanitizer);

  protected $chartData = toSignal(this.consultSerice.callProcedureOrFunction(), { initialValue: [] });

  protected $chart = signal<Chart>(null);
  protected $chartType = signal<ChartType>('line');

  //pdfs
  protected $pdfSrc = signal<string>(null);

  //images
  protected $filename = signal<string>(null);
  protected $selectedFiles = signal<FileList>(null);
  protected $imageData = signal<any>(null);

  constructor(){
    effect(() => {
      const data = this.$chartData();
      const type = this.$chartType();

      if (data && data.length > 0) {
        this.renderChart(data, type);
      }
    });
  }

  private renderChart(data: any[], type: ChartType){

    untracked( () => {
    //(Evita dependencia circular)
    const oldChart = this.$chart();
    if (oldChart) {
      oldChart.destroy();
    }

    const dates = data.map(item => item.consultdate);
    const quantities = data.map(item => item.quantity);

    const newChart = new Chart('canvas', {
        type: type, 
        data: {
          labels: dates,
          datasets: [
            {
              label: 'Quantity',
              data: quantities,
              borderColor: '#3cba9f',
              fill: false,   
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 0, 0.2)',
                'rgba(255, 159, 64, 0.2)',
              ],           
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            x: { display: true },
            y: {
              display: true,
              beginAtZero: true,
              ticks: { stepSize: 1 }
            },
          },
        },
      });

      this.$chart.set(newChart);
  });
  }

  change(type: ChartType){
    this.$chartType.set(type);
  }


  viewReport(){
    this.consultSerice.generateReport().subscribe(data => {
      const url = window.URL.createObjectURL(data);
      this.$pdfSrc.set(url);
    });
  }

  downloadReport(){
    this.consultSerice.generateReport().subscribe(data => {
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

  selectFile(e: any){
    const file: File = e.target.files[0];
    this.$filename.set(file.name);
    this.$selectedFiles.set(e.target.files);
  }

  upload(){
    const files = this.$selectedFiles();
    if(files && files.length > 0){
      this.consultSerice.saveFile(files[0]).subscribe();
    }
  }

  viewImage(){
    const ID = 1; //id del archivo a mostrar
    this.consultSerice.readFile(ID).subscribe(data => {      
      this.convertToBase64(data);
    });
  }

  private convertToBase64(file: Blob){    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64 = reader.result as string;
      this.$imageData.set(this.sanitizer.bypassSecurityTrustResourceUrl(base64));
    };
  }
}
