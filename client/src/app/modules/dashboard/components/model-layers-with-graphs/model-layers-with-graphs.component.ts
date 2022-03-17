import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { XMLGraphStoreState } from '@store/xml-graph-store';
import { ModelItem } from '@store/model-store/model.model';
import { ProjectItem, ProjectStatusNames } from '@store/project-store/project.model';
import { InferenceResultModel } from '@store/inference-result-store/inference-result.model';

@Component({
  selector: 'wb-model-layers-with-graphs',
  templateUrl: './model-layers-with-graphs.component.html',
  styleUrls: ['./model-layers-with-graphs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelLayersWithGraphsComponent implements OnInit {
  @Output() public loadOriginalGraph: EventEmitter<void> = new EventEmitter<void>();

  @Input() public project: ProjectItem;
  @Input() public model: ModelItem;
  @Input() public inferenceResult: InferenceResultModel;

  @Input() public runtimeGraph: XMLGraphStoreState.BaseGraphState;
  @Input() public originalGraph: XMLGraphStoreState.BaseGraphState;

  public selectedLayerName: string;
  public isGraphsBlockExpanded = false;

  public projectStatusNames = ProjectStatusNames;

  constructor(private readonly _gaService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this._gaService.emitNetronVisualizationEvent(this.model);
  }
}
