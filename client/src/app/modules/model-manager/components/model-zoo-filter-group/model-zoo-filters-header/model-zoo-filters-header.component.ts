import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'wb-model-zoo-filters-header',
  templateUrl: './model-zoo-filters-header.component.html',
  styleUrls: ['./model-zoo-filters-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooFiltersHeaderComponent {
  @Input() appliedFiltersCount: number = null;

  @Output() resetAllFilters = new EventEmitter<void>();
}
