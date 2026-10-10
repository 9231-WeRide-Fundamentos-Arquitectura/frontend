import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

// Página pública de texto para /terms y /privacy (la ruta indica cuál mediante data.legal).
@Component({
  selector: 'app-legal',
  imports: [RouterLink, TranslateModule],
  template: `
    <main class="legal">
      <a class="back" routerLink="/auth/login">← {{ 'common.back' | translate }}</a>
      <h1>{{ 'legal.' + kind + '.title' | translate }}</h1>
      <p class="updated">{{ 'legal.updated' | translate }}</p>
      @for (section of sections; track section) {
        <section>
          <h2>{{ 'legal.' + kind + '.' + section + '.title' | translate }}</h2>
          <p>{{ 'legal.' + kind + '.' + section + '.body' | translate }}</p>
        </section>
      }
    </main>
  `,
  styles: [`
    .legal { max-width: 760px; margin: 0 auto; padding: 2rem 1.25rem 4rem; color: #1f2937; line-height: 1.6; }
    .back { display: inline-block; margin-bottom: 1rem; color: #6f4dff; text-decoration: none; font-weight: 600; }
    h1 { margin: 0 0 0.25rem; font-size: 1.75rem; }
    h2 { margin: 1.5rem 0 0.25rem; font-size: 1.15rem; }
    .updated { color: #6b7280; margin: 0 0 1rem; font-size: 0.875rem; }
    p { margin: 0; }
  `]
})
export class LegalComponent {
  readonly kind: 'terms' | 'privacy' = inject(ActivatedRoute).snapshot.data['legal'] === 'privacy' ? 'privacy' : 'terms';
  readonly sections = this.kind === 'terms'
    ? ['use', 'account', 'rides', 'payments', 'liability']
    : ['data', 'purpose', 'sharing', 'rights'];
}
