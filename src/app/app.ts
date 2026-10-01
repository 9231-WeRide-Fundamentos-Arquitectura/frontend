import { Component, signal, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { BookingNotificationService } from './booking/application/booking-notification.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('Frontend-WeRide');
  private translate = inject(TranslateService);
  private bookingNotificationService = inject(BookingNotificationService);
  private auth = inject(AuthService);

  constructor() {
    effect(() => {
      if (this.auth.session()) this.bookingNotificationService.startMonitoring();
      else this.bookingNotificationService.stopMonitoring();
    });
  }

  ngOnInit() {
    const defaultLang = 'es';
    const browserLang = navigator.language.split('-')[0];
    const lang = ['en', 'es'].includes(browserLang) ? browserLang : defaultLang;

    this.translate.setDefaultLang(defaultLang);

    this.translate.use(lang).subscribe(() => {
    });
  }

  ngOnDestroy() {
    this.bookingNotificationService.stopMonitoring();
  }
}
