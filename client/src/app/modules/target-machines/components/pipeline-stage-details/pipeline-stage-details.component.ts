import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import {
  ConfigureTargetPipelineStage,
  pipelineStageErrorNameMap,
  PipelineStageStatusNames,
} from '@shared/models/pipelines/target-machines/configure-target-pipeline';

@Component({
  selector: 'wb-pipeline-stage-details',
  templateUrl: './pipeline-stage-details.component.html',
  styleUrls: ['./pipeline-stage-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineStageDetailsComponent implements AfterViewInit, OnChanges {
  @Input()
  stage: ConfigureTargetPipelineStage;

  @ViewChild('stageLogsDetails') openedStageLogsDetails: ElementRef;
  @ViewChild('logsInProgressIndicator') logsInProgressIndicator: ElementRef;

  private stageLogsDetailsContainer: HTMLElement;
  private logsInProgressIndicatorElement: HTMLElement;

  ngAfterViewInit(): void {
    this.stageLogsDetailsContainer = this.openedStageLogsDetails.nativeElement;
    this.logsInProgressIndicatorElement = this.logsInProgressIndicator.nativeElement;
    this.scrollToBottomOfLogsContainer();
  }

  ngOnChanges({ stage }: SimpleChanges): void {
    this.scrollToBottomOfLogsContainer();
  }

  private scrollToBottomOfLogsContainer(): void {
    if (!this.stageLogsDetailsContainer || !this.logsInProgressIndicatorElement) {
      return;
    }
    const logsDetailsContainerRect = this.stageLogsDetailsContainer.getBoundingClientRect();
    const parentViewableArea = {
      height: this.stageLogsDetailsContainer.clientHeight,
      width: this.stageLogsDetailsContainer.clientWidth,
    };

    const childRect = this.logsInProgressIndicatorElement.getBoundingClientRect();
    const isViewable =
      childRect.top >= logsDetailsContainerRect.top &&
      childRect.top <= logsDetailsContainerRect.top + parentViewableArea.height;

    if (!isViewable) {
      this.stageLogsDetailsContainer.scrollTop =
        childRect.top + this.stageLogsDetailsContainer.scrollTop - logsDetailsContainerRect.top;
    }
  }

  get isStageInProgress(): boolean {
    return this.stage && this.stage.status === PipelineStageStatusNames.IN_PROGRESS;
  }

  getErrorName(message) {
    return pipelineStageErrorNameMap[message] ? pipelineStageErrorNameMap[message] : message;
  }
}
