import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { UserStore } from '../../../application/user.store';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';
import { User } from '../../../domain/model/user.entity';

@Component({
  selector: 'app-user-personal-info-card',
  standalone: true,
  imports: [CommonModule, MatIcon, ReactiveFormsModule, TranslateModule],
  templateUrl: './user-personal-info-card.html',
  styleUrl: './user-personal-info-card.css'
})
export class UserPersonalInfoCard implements OnInit {
  private destroyRef = inject(DestroyRef);
  private readonly userStore = inject(UserStore);
  private readonly stateService = inject(UserSettingsStateService);
  private readonly fb = inject(FormBuilder);

  user$ = this.userStore.getGuestUser$();
  currentUser: User | null = null;
  
  personalInfoForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  profilePicturePreview = '';

  ngOnInit(): void {
    this.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.initializeForm(user);
        this.profilePicturePreview = user.profilePicture || '';
      }
    });
  }

  private initializeForm(user: User): void {
    this.personalInfoForm = this.fb.group({
      name: [user.name, [Validators.required, Validators.minLength(2)]],
      phone: [user.phone, [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      profilePicture: [user.profilePicture || '']
    });
  }

  closeCard(): void {
    this.stateService.closeSection();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 1024 * 1024) {
        this.errorMessage = 'user.personalInfo.photoTooBig';
        input.value = '';
        return;
      }
      this.errorMessage = '';
      const reader = new FileReader();
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result as string;
        this.profilePicturePreview = result;
        this.personalInfoForm.patchValue({ profilePicture: result });
      };
      
      reader.readAsDataURL(file);
    }
  }

  savePersonalInfo(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.personalInfoForm.invalid) {
      this.errorMessage = 'user.personalInfo.fixErrors';
      this.markFormGroupTouched(this.personalInfoForm);
      return;
    }

    if (!this.currentUser) {
      this.errorMessage = 'user.personalInfo.userNotLoaded';
      return;
    }

    this.isLoading = true;

    const formValue = this.personalInfoForm.value;
    const updatedUser = {
      ...this.currentUser,
      name: formValue.name,
      phone: formValue.phone,
      profilePicture: formValue.profilePicture
    };

    this.userStore.updateUser(this.currentUser.id, updatedUser).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'user.personalInfo.saved';
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'user.personalInfo.saveError';
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get nameError(): string {
    const control = this.personalInfoForm.get('name');
    if (control?.hasError('required') && control.touched) {
      return 'user.personalInfo.nameRequired';
    }
    if (control?.hasError('minlength') && control.touched) {
      return 'user.personalInfo.nameMin';
    }
    return '';
  }

  get phoneError(): string {
    const control = this.personalInfoForm.get('phone');
    if (control?.hasError('required') && control.touched) {
      return 'user.personalInfo.phoneRequired';
    }
    if (control?.hasError('pattern') && control.touched) {
      return 'user.personalInfo.phoneFormat';
    }
    return '';
  }
}
