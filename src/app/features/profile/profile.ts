import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { UserService } from '../../core/services/user';
import { AuthService } from '../../core/services/auth';
import { AppAccessService } from '../../core/services/app-access';
import { AppResponse } from '../../core/models/app';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { SuccessDialogComponent } from '../../shared/components/success-dialog/success-dialog';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit {
  isLoading = signal(true);
  errorMessage = signal('');
  assignedApps = signal<AppResponse[]>([]);

  currentUser = computed(() => this.authService.currentUser());
  isUser = computed(() => this.currentUser()?.role === 'USER');

  // Profile form
  profileForm: FormGroup;

  // Password form
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private appAccessService: AppAccessService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
      });
    }

    if (this.isUser()) {
      this.loadAssignedApps();
    }

    this.isLoading.set(false);
  }

  private loadAssignedApps(): void {
    const userId = this.currentUser()?.id;
    if (!userId) return;
    this.appAccessService.getAppsForUser(userId).subscribe({
      next: (apps: AppResponse[]) => this.assignedApps.set(apps),
    });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  get nameError(): string {
    const ctrl = this.profileForm.get('name');
    if (ctrl?.touched && ctrl.hasError('required')) return 'Name is required.';
    if (ctrl?.touched && ctrl.hasError('minlength')) return 'Name must be at least 2 characters.';
    return '';
  }

  get emailError(): string {
    const ctrl = this.profileForm.get('email');
    if (ctrl?.touched && ctrl.hasError('required')) return 'Email is required.';
    if (ctrl?.touched && ctrl.hasError('email')) return 'Please enter a valid email.';
    return '';
  }

  get newPasswordError(): string {
    const ctrl = this.passwordForm.get('newPassword');
    if (ctrl?.touched && ctrl.hasError('required')) return 'New password is required.';
    if (ctrl?.touched && ctrl.hasError('minlength')) return 'Password must be at least 8 characters.';
    return '';
  }

  get confirmPasswordError(): string {
    const ctrl = this.passwordForm.get('confirmPassword');
    if (ctrl?.touched && this.passwordForm.hasError('passwordMismatch')) return 'Passwords do not match.';
    return '';
  }

  private showSuccess(title: string, message: string): void {
    this.dialog.open(SuccessDialogComponent, {
      position: { top: '80px' },
      data: { title, message },
    });
  }

  saveProfile(): void {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      position: { top: '80px' },
      data: {
        title: 'Update Profile',
        message: 'Are you sure you want to update your profile information?',
        confirmLabel: 'Save',
        cancelLabel: 'Cancel',
        isDanger: false,
      },
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      const userId = this.currentUser()?.id;
      if (!userId) return;

      this.userService.editProfile(userId, {
        name: this.profileForm.get('name')?.value,
        email: this.profileForm.get('email')?.value,
      }).subscribe({
        next: (updatedUser) => {
          this.authService.saveUser({
            ...this.currentUser()!,
            name: updatedUser.name,
            email: updatedUser.email,
          });
          this.showSuccess('Profile Updated', 'Your profile has been updated successfully.');
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to update profile.', 'Close', { duration: 3000 });
        },
      });
    });
  }

  savePassword(): void {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      position: { top: '80px' },
      data: {
        title: 'Change Password',
        message: 'Are you sure you want to change your password?',
        confirmLabel: 'Change',
        cancelLabel: 'Cancel',
        isDanger: false,
      },
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      const userId = this.currentUser()?.id;
      if (!userId) return;

      this.userService.editProfile(userId, {
        currentPassword: this.passwordForm.get('currentPassword')?.value,
        newPassword: this.passwordForm.get('newPassword')?.value,
      }).subscribe({
        next: () => {
          this.passwordForm.reset();
          this.showSuccess('Password Changed', 'Your password has been changed successfully.');
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to change password.', 'Close', { duration: 3000 });
        },
      });
    });
  }

  getInitials(): string {
    const name = this.currentUser()?.name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleLabel(): string {
    switch (this.currentUser()?.role) {
      case 'SYSTEM_ADMIN': return 'System Admin';
      case 'ADMIN': return 'Admin';
      default: return 'Normal User';
    }
  }

  getRoleBadgeClass(): string {
    switch (this.currentUser()?.role) {
      case 'SYSTEM_ADMIN': return 'badge badge-system-admin';
      case 'ADMIN': return 'badge badge-admin';
      default: return 'badge badge-user';
    }
  }
}
