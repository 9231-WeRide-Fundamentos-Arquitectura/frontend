import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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
    this.user$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        const storedProfile = localStorage.getItem('userProfile');
        const profileData = storedProfile ? JSON.parse(storedProfile) : user;
        this.initializeForm(profileData);
        this.profilePicturePreview = profileData.profilePicture || '';
      }
    });
  }

  private initializeForm(user: User): void {
    this.personalInfoForm = this.fb.group({
      name: [user.name, [Validators.required, Validators.minLength(2)]],
      email: [user.email, [Validators.required, Validators.email]],
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
      this.errorMessage = 'Por favor, corrija los errores en el formulario';
      this.markFormGroupTouched(this.personalInfoForm);
      return;
    }

    if (!this.currentUser) {
      this.errorMessage = 'No se pudo cargar el usuario';
      return;
    }

    this.isLoading = true;

    const formValue = this.personalInfoForm.value;
    const updatedUser = {
      ...this.currentUser,
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      profilePicture: formValue.profilePicture
    };

    try {
      localStorage.setItem('userProfile', JSON.stringify(updatedUser));

      this.userStore.updateUser(this.currentUser.id, updatedUser).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Información actualizada correctamente';
          setTimeout(() => {
            this.closeCard();
          }, 1500);
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          
          const storedUser = localStorage.getItem('userProfile');
          if (storedUser) {
            this.isLoading = false;
            this.errorMessage = 'Error de conexión. Los datos se guardaron localmente y se sincronizarán cuando haya conexión';
            setTimeout(() => {
              this.closeCard();
            }, 2000);
          } else {
            this.isLoading = false;
            this.errorMessage = 'Error al guardar la información. Por favor, intente nuevamente';
          }
        }
      });
    } catch (error) {
      this.isLoading = false;
      this.errorMessage = 'Error al procesar los datos';
    }
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
      return 'El nombre es obligatorio';
    }
    if (control?.hasError('minlength') && control.touched) {
      return 'El nombre debe tener al menos 2 caracteres';
    }
    return '';
  }

  get emailError(): string {
    const control = this.personalInfoForm.get('email');
    if (control?.hasError('required') && control.touched) {
      return 'El correo electrónico es obligatorio';
    }
    if (control?.hasError('email') && control.touched) {
      return 'El formato del correo electrónico no es válido';
    }
    return '';
  }

  get phoneError(): string {
    const control = this.personalInfoForm.get('phone');
    if (control?.hasError('required') && control.touched) {
      return 'El número de celular es obligatorio';
    }
    if (control?.hasError('pattern') && control.touched) {
      return 'El formato del número no es válido. Use formato internacional (ej: +51987654321)';
    }
    return '';
  }
}
