import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _dark = signal(false);
  readonly isDark = this._dark.asReadonly();

  constructor() {
    const saved = localStorage.getItem('ux-theme');
    const startDark = saved === 'dark';
    this._dark.set(startDark);
    this.apply(startDark);
  }

  toggle() {
    const next = !this._dark();
    this._dark.set(next);
    this.apply(next);
    localStorage.setItem('ux-theme', next ? 'dark' : 'light');
  }

  private apply(dark: boolean) {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
}
