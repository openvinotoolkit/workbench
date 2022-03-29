import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { BaseModelZooDataSource } from '@shared/models/model-zoo-data-source/base-model-zoo-data-source';

class FakeModelZooDataSource extends BaseModelZooDataSource<null> {
  readonly sortOptions = [];
}

@Component({
  selector: 'wb-card-grid-skeleton',
  templateUrl: './card-grid-skeleton.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardGridSkeletonComponent {
  @Input() set cards(value: number) {
    this.dataSource.data = Array.from({ length: value || 4 });
  }

  @Input() set rowsPerCard(value: number) {
    this.fakeRows = Array.from({ length: value || 2 });
  }

  fakeRows: null[];
  dataSource = new FakeModelZooDataSource();
}
