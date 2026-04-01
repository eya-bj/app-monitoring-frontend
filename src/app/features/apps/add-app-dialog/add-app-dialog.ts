import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { AppService } from '../../../core/services/app';
import { CreateAppRequest } from '../../../core/models/app';

@Component({
  selector: 'add-app-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule],
  templateUrl: './add-app-dialog.html',
  styleUrl: './add-app-dialog.scss',
})
export class AddAppDialogComponent {
  isLoading = signal(false);
  errorMessage = signal('');

  name = '';
  description = '';
  url = '';
  environment: 'DEVELOPMENT' | 'UAT' | 'PRODUCTION' = 'PRODUCTION';

  environmentOptions = [
    { value: 'PRODUCTION', label: 'Production' },
    { value: 'UAT', label: 'UAT' },
    { value: 'DEVELOPMENT', label: 'Development' },
  ];

  constructor(
    private dialogRef: MatDialogRef<AddAppDialogComponent>,
    private appService: AppService
  ) {}

  submit(): void {
    if (!this.isFormValid()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const request: CreateAppRequest = {
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      url: this.url.trim(),
      environment: this.environment,
    };

    this.appService.createApp(request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'Failed to create application.'
        );
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  getNameError(): string {
  if (!this.name.trim()) return 'Name is required';
  if (this.name.trim().length > 255) return 'Name must not exceed 255 characters';
  return '';
}

getUrlError(): string {
  if (!this.url.trim()) return 'URL is required';
  if (!/^(http|https):\/\/.+/.test(this.url.trim()))
    return 'URL must start with http:// or https://';
  return '';
}

isFormValid(): boolean {
  return (
    !this.getNameError() &&
    !this.getUrlError()
  );
}
}
