import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoomImage } from '../../../model/room-image';
import { RoomImageService } from '../../../services/room-image.service';

export interface RoomPhotosDialogData {
  roomId: number;
  roomNumber: string;
}

@Component({
  selector: 'app-room-photos-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './room-photos-dialog.component.html',
  styleUrl: './room-photos-dialog.component.css',
})
export class RoomPhotosDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<RoomPhotosDialogComponent>);
  private readonly data = inject<RoomPhotosDialogData>(MAT_DIALOG_DATA);
  private readonly roomImageService = inject(RoomImageService);

  protected readonly roomId = this.data.roomId;
  protected readonly roomNumber = this.data.roomNumber;

  protected $images = signal<RoomImage[]>([]);
  protected $loading = signal(true);
  protected $saving = signal(false);
  protected $deletingId = signal<number | null>(null);
  protected $lightbox = signal<string | null>(null);
  protected $hasImages = computed(() => this.$images().length > 0);

  protected urlControl = new FormControl<string>('', [
    Validators.required,
    Validators.pattern(/^https?:\/\/.+/),
  ]);

  ngOnInit() {
    this.loadImages();
  }

  private loadImages() {
    this.$loading.set(true);
    this.roomImageService.findByRoom(this.roomId).subscribe({
      next: (list) => {
        this.$images.set(list);
        this.$loading.set(false);
      },
      error: () => this.$loading.set(false),
    });
  }

  addUrl() {
    if (this.urlControl.invalid) {
      this.urlControl.markAsTouched();
      return;
    }
    const url = this.urlControl.value!.trim();
    const fileName = url.split('/').pop()?.split('?')[0] || 'photo.jpg';

    this.$saving.set(true);
    this.roomImageService.saveUrl(this.roomId, url, fileName).subscribe({
      next: () => {
        this.urlControl.reset();
        this.loadImages();
        this.$saving.set(false);
      },
      error: () => this.$saving.set(false),
    });
  }

  delete(image: RoomImage) {
    this.$deletingId.set(image.idFile);
    this.roomImageService.delete(this.roomId, image.idFile).subscribe({
      next: () => {
        this.$deletingId.set(null);
        this.$images.update(imgs => imgs.filter(i => i.idFile !== image.idFile));
        if (this.$lightbox() === image.url) this.$lightbox.set(null);
      },
      error: () => this.$deletingId.set(null),
    });
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const card = img.closest('.photo-card');
    if (card && !card.querySelector('.img-error')) {
      const placeholder = document.createElement('div');
      placeholder.className = 'img-error';
      placeholder.innerHTML = '<span class="material-icons">broken_image</span><small>URL inválida</small>';
      card.insertBefore(placeholder, img);
    }
  }

  openLightbox(url: string) { this.$lightbox.set(url); }
  closeLightbox() { this.$lightbox.set(null); }
  close() { this.dialogRef.close(); }
}
