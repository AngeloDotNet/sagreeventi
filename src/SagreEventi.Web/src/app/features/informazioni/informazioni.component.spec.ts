import { TestBed } from '@angular/core/testing';
import { BUILD_INFO } from '../../core/build-info.generated';
import { InformazioniComponent } from './informazioni.component';

describe('InformazioniComponent version', () => {
  const crea = (): HTMLElement => {
    TestBed.configureTestingModule({ imports: [InformazioniComponent] });
    const fixture = TestBed.createComponent(InformazioniComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('shows the app version from the build info', () => {
    const el = crea();

    expect(el.querySelector('[data-testid="versione"]')?.textContent?.trim()).toBe(BUILD_INFO.version);
  });

  it('shows the build date in Italian format (dd/mm/yyyy), without time', () => {
    const el = crea();
    const data = el.querySelector('[data-testid="data-build"]')?.textContent?.trim() ?? '';

    expect(data).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(data).toBe(BUILD_INFO.buildDate);
  });
});
