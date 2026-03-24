import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AppAccessService } from '../../../core/services/app-access';
import { AppResponse } from '../../../core/models/app';

export interface AssignAppDialogData {
  userId: number;
  userName: string;
  availableApps: AppResponse[];
}

@Component({
  selector: 'app-assign-app-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './assign-app-dialog.html',
  styleUrl: './assign-app-dialog.scss',
})
export class AssignAppDialogComponent {
  selectedAppId = signal<number | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    public dialogRef: MatDialogRef<AssignAppDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignAppDialogData,
    private appAccessService: AppAccessService,
  ) {}

  assign(): void {
    const appId = this.selectedAppId();
    if (!appId) return;

    this.isLoading.set(true);
    this.appAccessService.assignUserToApp({ userId: this.data.userId, appId }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to assign app.');
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
