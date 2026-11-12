import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BUILD_INFO } from '../../../core/build-info-generated/build-info.generated';

/** Static page with what the app is, how it works, the MIT license, the link to the source code and the app version. */
@Component({
  selector: 'app-informazioni',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './informazioni.component.html',
  styleUrl: './informazioni.component.css',
})
export class InformazioniComponent {
  protected readonly repository = 'https://github.com/AngeloDotNet/SagreEventi';
  protected readonly licenza = `${this.repository}/blob/main/LICENSE`;
  protected readonly versione = BUILD_INFO.version;
  protected readonly dataBuild = BUILD_INFO.buildDate;
}
