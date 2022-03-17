import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { BenchmarkChartComponent } from './components/benchmark-chart/benchmark-chart.component';
import { ComparePageComponent } from './pages/compare-page/compare-page.component';
import { InferenceHistoryComponent } from './components/inference-history/inference-history.component';
import { ProjectModule } from '../project/project.module';
import { DeploymentManagerComponent } from './components/deployment-manager/deployment-manager.component';
import { ProfileConfigurationComponent } from './components/profile-configuration/profile-configuration.component';
import { InferenceConfigurationPageComponent } from './pages/inference-configuration-page/inference-configuration-page.component';
import { InferenceMatrixSelectComponent } from './components/inference-matrix-select/inference-matrix-select.component';
import { SelectedInferencesTableComponent } from './components/selected-inferences-table/selected-inferences-table.component';
import { InferenceMatrixCellComponent } from './components/inference-matrix-select/inference-matrix-cell/inference-matrix-cell.component';
import { InferenceConfigurationService } from './pages/inference-configuration-page/inference-configuration.service';
import { AccuracyModule } from '../accuracy/accuracy.module';
import { ModelLayersWithGraphsModule } from './components/model-layers-with-graphs/model-layers-with-graphs.module';
import { ProjectExportComponent } from './components/project-export/project-export.component';
import { LayersDistributionComponent } from './components/precision-analysis/layers-distribution/layers-distribution.component';
import { LayersDistributionComparisonComponent } from './components/precision-analysis/layers-distribution-comparison/layers-distribution-comparison.component';
import { PrecisionAnalysisComponent } from './components/precision-analysis/precision-analysis.component';
import { ExecutionAttributesComponent } from './components/precision-analysis/execution-attributes/execution-attributes.component';
import { PrecisionDistributionComponent } from './components/precision-analysis/precision-distribution/precision-distribution.component';
import { PrecisionTransitionMatrixComponent } from './components/precision-analysis/precision-transition-matrix/precision-transition-matrix.component';
import { PointsTableComponent } from './components/points-table/points-table.component';
import { CompareColumnComponent } from './components/compare-column/compare-column.component';
import { PrecisionAnalysisAdvisorComponent } from './components/precision-analysis/precision-analysis-advisor/precision-analysis-advisor.component';
import { OpenSampleTutorialComponent } from './components/open-sample-tutorial/open-sample-tutorial.component';
import { OpenGeneratedTutorialComponent } from './components/open-generated-tutorial/open-generated-tutorial.component';
import { OpenvinoNotebooksTutorialComponent } from './components/openvino-notebooks-tutorial/openvino-notebooks-tutorial.component';
import { ProjectsByModelTableComponent } from './components/projects-by-model-table/projects-by-model-table.component';
import { ModelProjectsComponent } from './components/model-projects/model-projects.component';
import { CreateAccuracyReportRibbonContentComponent } from './components/create-accuracy-report-ribbon-content/create-accuracy-report-ribbon-content.component';
import { AnalyzeAccuracyRibbonContentComponent } from './components/analyze-accuracy-ribbon-content/analyze-accuracy-ribbon-content.component';
import { ProjectInfoPanelComponent } from './components/project-info-panel/project-info-panel.component';
import { ProjectProgressComponent } from './components/project-progress/project-progress.component';
import { AccuracyReportTypeRadioGroupComponent } from './components/accuracy-report-type-radio-group/accuracy-report-type-radio-group.component';
import { OptimizePerformanceRibbonContentComponent } from './components/optimize-performance-ribbon-content/optimize-performance-ribbon-content.component';
import { OptimizationBannerComponent } from './components/optimize-performance-ribbon-content/optimization-banner/optimization-banner.component';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule,
    ProjectModule,
    AccuracyModule,
    ModelLayersWithGraphsModule,
  ],
  declarations: [
    BarChartComponent,
    BenchmarkChartComponent,
    ComparePageComponent,
    InferenceHistoryComponent,
    DeploymentManagerComponent,
    ProfileConfigurationComponent,
    InferenceConfigurationPageComponent,
    InferenceMatrixSelectComponent,
    SelectedInferencesTableComponent,
    InferenceMatrixCellComponent,
    PointsTableComponent,
    ProjectExportComponent,
    CompareColumnComponent,
    LayersDistributionComponent,
    LayersDistributionComparisonComponent,
    PrecisionAnalysisComponent,
    ExecutionAttributesComponent,
    PrecisionDistributionComponent,
    PrecisionTransitionMatrixComponent,
    PrecisionAnalysisAdvisorComponent,
    OpenSampleTutorialComponent,
    OpenGeneratedTutorialComponent,
    OpenvinoNotebooksTutorialComponent,
    ProjectsByModelTableComponent,
    ModelProjectsComponent,
    DashboardPageComponent,
    ProjectInfoPanelComponent,
    ProjectProgressComponent,
    CreateAccuracyReportRibbonContentComponent,
    AnalyzeAccuracyRibbonContentComponent,
    AccuracyReportTypeRadioGroupComponent,
    OptimizePerformanceRibbonContentComponent,
    OptimizationBannerComponent,
  ],
  providers: [InferenceConfigurationService],
  exports: [ModelProjectsComponent],
})
export class DashboardModule {}
