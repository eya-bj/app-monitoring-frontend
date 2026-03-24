import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { UserService } from '../../../core/services/user';
import { AuthService } from '../../../core/services/auth';
import { UserResponse } from '../../../core/models/user';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SuccessDialogComponent } from '../../../shared/components/success-dialog/success-dialog';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './add-user-dialog.html',
  styleUrl: './add-user-dialog.scss',
})
export class AddUserDialogComponent {
  form: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  isSystemAdmin = signal(false);

  readonly roleOptions = [
    { value: 'USER', label: 'Normal User' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<AddUserDialogComponent>,
  ) {
    this.isSystemAdmin.set(this.authService.currentUser()?.role === 'SYSTEM_ADMIN');

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['USER', Validators.required],
    });

    if (!this.isSystemAdmin()) {
      this.form.get('role')?.disable();
    }
  }

  get nameError(): string {
    const ctrl = this.form.get('name');
    if (ctrl?.hasError('required')) return 'Name is required.';
    if (ctrl?.hasError('minlength')) return 'Name must be at least 2 characters.';
    return '';
  }

  get emailError(): string {
    const ctrl = this.form.get('email');
    if (ctrl?.hasError('required')) return 'Email is required.';
    if (ctrl?.hasError('email')) return 'Please enter a valid email.';
    return '';
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    // Step 1 — confirm creation
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      position: { top: '80px' },
      data: {
        title: 'Add User',
        message: `Are you sure you want to create a new user with email ${this.form.get('email')?.value}?`,
        confirmLabel: 'Create',
        cancelLabel: 'Cancel',
        isDanger: false,
      },
    });

    confirmRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.createUser();
    });
  }

  private createUser(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const payload = {
      name: this.form.get('name')?.value,
      email: this.form.get('email')?.value,
      role: this.form.get('role')?.value || 'USER',
    };

    this.userService.createUser(payload).subscribe({
      next: (user: UserResponse) => {
        this.isLoading.set(false);

        // Step 2 — success dialog
        const successRef = this.dialog.open(SuccessDialogComponent, {
          position: { top: '80px' },
          data: {
            title: 'User Created',
            message: `${user.name} has been created successfully. Their default password is ${user.name.split(' ')[0]}@${new Date().getFullYear()}.`,
          },
        });

        successRef.afterClosed().subscribe(() => {
          // Step 3 — if USER role, ask to assign app
          if (payload.role === 'USER') {
            const assignRef = this.dialog.open(ConfirmDialogComponent, {
              position: { top: '80px' },
              data: {
                title: 'Assign Application',
                message: `Would you like to assign ${user.name} to an application now?`,
                confirmLabel: 'Yes, Assign',
                cancelLabel: 'No, Skip',
                isDanger: false,
              },
            });

            assignRef.afterClosed().subscribe((wantsAssign: boolean) => {
              this.dialogRef.close({ created: true, user, assign: wantsAssign });
            });
          } else {
            this.dialogRef.close({ created: true, user, assign: false });
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to create user.');
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
