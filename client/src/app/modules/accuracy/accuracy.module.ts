import { NgModule } from '@angular/core';

import { SharedModule } from '@shared/shared.module';

import { NetworkOutputComponent } from './components/visualization/network-output/network-output.component';
import { InferenceResultsComponent } from './components/visualization/network-output/inference-results/inference-results.component';
import { ClassificationResultsComponent } from './components/visualization/network-output/inference-results/classification-results/classification-results.component';
import { ColorCodingService } from './color-coding.service';
import { ErrorBlockComponent } from './components/visualization/network-output/error-block/error-block.component';
import { LabelSetsComponent } from './components/visualization/network-output/label-sets/label-sets.component';
import { ImageRendererComponent } from './components/visualization/network-output/image-renderer/image-renderer.component';
import { PaintingCanvasComponent } from './components/visualization/network-output/image-renderer/painting-canvas/painting-canvas.component';
import { AdvancedAccuracyConfigurationComponent } from './components/advanced-accuracy-configuration/advanced-accuracy-configuration.component';
import { VisualizationConfigurationComponent } from './components/visualization/visualization-configuration/visualization-configuration.component';
import { StatusBlockComponent } from './components/advanced-accuracy-configuration/status-block/status-block.component';
import { NetworkOutputVisualizerComponent } from './components/visualization/network-output-visualizer/network-output-visualizer.component';
import { ExplainableAiDescriptionComponent } from './components/visualization/network-output/explainable-ai-description/explainable-ai-description.component';
import { OriginalImageControlsComponent } from './components/visualization/network-output/original-image-controls/original-image-controls.component';
import { VisualizationProgressComponent } from './components/visualization/network-output/visualization-progress/visualization-progress.component';
import { DynamicTableComponent } from './components/dynamic-table/dynamic-table.component';
import { DetectionAccuracyReportTableComponent } from './components/detection-accuracy-report-table/detection-accuracy-report-table.component';
import { ClassificationAccuracyReportTableComponent } from './components/classification-accuracy-report-table/classification-accuracy-report-table.component';
import { PerTensorAccuracyReportTableComponent } from './components/per-tensor-accuracy-report-table/per-tensor-accuracy-report-table.component';
import { PerTensorImageVisualizationComponent } from './components/visualization/per-tensor-image-visualization/per-tensor-image-visualization.component';
import { ReferencePredictionsComponent } from './components/visualization/reference-predictions/reference-predictions.component';
import { DynamicPipe } from './components/dynamic-table/dynamic.pipe';
import { DetectionSegmentationResultsComponent } from './components/visualization/network-output/inference-results/detection-segmentation-results/detection-segmentation-results.component';
import { PredictionBadgeComponent } from './components/visualization/network-output/inference-results/detection-segmentation-results/object-detection-predictions/prediction-badge/prediction-badge.component';
import { ObjectDetectionPredictionsComponent } from './components/visualization/network-output/inference-results/detection-segmentation-results/object-detection-predictions/object-detection-predictions.component';
import { SemanticSegmentationAccuracyReportTableComponent } from './components/semantic-segmentation-accuracy-report-table/semantic-segmentation-accuracy-report-table.component';
import { InstanceSegmentationAccuracyReportTableComponent } from './components/instance-segmentation-accuracy-report-table/instance-segmentation-accuracy-report-table.component';

@NgModule({
  declarations: [
    NetworkOutputComponent,
    InferenceResultsComponent,
    ClassificationResultsComponent,
    ErrorBlockComponent,
    LabelSetsComponent,
    ImageRendererComponent,
    PaintingCanvasComponent,
    AdvancedAccuracyConfigurationComponent,
    VisualizationConfigurationComponent,
    StatusBlockComponent,
    NetworkOutputVisualizerComponent,
    ExplainableAiDescriptionComponent,
    OriginalImageControlsComponent,
    VisualizationProgressComponent,
    ObjectDetectionPredictionsComponent,
    DynamicTableComponent,
    DetectionAccuracyReportTableComponent,
    ClassificationAccuracyReportTableComponent,
    PerTensorAccuracyReportTableComponent,
    PerTensorImageVisualizationComponent,
    ReferencePredictionsComponent,
    DynamicPipe,
    DetectionSegmentationResultsComponent,
    PredictionBadgeComponent,
    SemanticSegmentationAccuracyReportTableComponent,
    InstanceSegmentationAccuracyReportTableComponent,
  ],
  imports: [SharedModule],
  providers: [ColorCodingService],
  exports: [
    NetworkOutputComponent,
    AdvancedAccuracyConfigurationComponent,
    NetworkOutputVisualizerComponent,
    ImageRendererComponent,
    DetectionAccuracyReportTableComponent,
    ClassificationAccuracyReportTableComponent,
    PerTensorAccuracyReportTableComponent,
    PerTensorImageVisualizationComponent,
    ReferencePredictionsComponent,
    SemanticSegmentationAccuracyReportTableComponent,
    InstanceSegmentationAccuracyReportTableComponent,
  ],
})
export class AccuracyModule {}
