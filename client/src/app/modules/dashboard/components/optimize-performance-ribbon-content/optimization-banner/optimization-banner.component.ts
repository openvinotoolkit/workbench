import { Component, ChangeDetectionStrategy, Input, HostBinding, Inject, LOCALE_ID } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'wb-optimization-banner',
  templateUrl: './optimization-banner.component.html',
  styleUrls: ['./optimization-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptimizationBannerComponent {
  _modelSizeImprovement: number = null;
  @Input() set modelSizeImprovement(value: number) {
    this._modelSizeImprovement = value;
  }

  _performanceImprovement: number = null;
  @Input() set performanceImprovement(value: number) {
    this._performanceImprovement = value;
  }

  @Input() disabled = false;

  @HostBinding('class') hostClass = 'wb-panel';

  readonly labels = {
    expectedImprovementHeader: 'Expected theoretical performance improvements',
    obtainedImprovementHeader: 'Obtained optimization compared to parent model',
    upTo: 'Up To',
    modelSizeImprovement: 'Smaller model size',
    expectedModelSizeImprovement: '4X',
    performanceImprovement: 'Performance boost',
    expectedPerformanceImprovement: '2–4X',
  };

  private readonly _decimalPipe = new DecimalPipe(this._localeId);

  constructor(@Inject(LOCALE_ID) private readonly _localeId) {}

  private _formatImprovement(value: number): string {
    return `${this._decimalPipe.transform(value, '1.0-2')}X`;
  }

  get formattedModelSizeImprovement(): string {
    return this.haveObtainedImprovements
      ? this._formatImprovement(this._modelSizeImprovement)
      : this.labels.expectedModelSizeImprovement;
  }

  get formattedPerformanceImprovement(): string {
    return this.haveObtainedImprovements
      ? this._formatImprovement(this._performanceImprovement)
      : this.labels.expectedPerformanceImprovement;
  }

  get haveObtainedImprovements(): boolean {
    return Number.isFinite(this._modelSizeImprovement) && Number.isFinite(this._performanceImprovement);
  }
}
