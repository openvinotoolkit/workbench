import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DirectivesModule } from '@shared/directives/directives.module';
import { MasterDetailComponent } from '@shared/components/master-detail/master-detail.component';
import { ButtonModule } from '@shared/components/button/button.module';
import { MarkdownTextModule } from '@shared/components/markdown-text/markdown-text.module';
import { ModelDetailsComponent } from '@shared/components/model-details/model-details.component';
import { ParameterDetailsComponent } from '@shared/components/model-details/parameter-details/parameter-details.component';
import { pipes } from '@shared/pipes';
import { ConfigFormFieldComponent } from '@shared/components/config-form-field/config-form-field.component';
import { RatioBarComponent } from '@shared/components/ratio-bar/ratio-bar.component';
import { FileUploadFieldComponent } from '@shared/components/file-upload-field/file-upload-field.component';
import { NavigationBarModule } from '@shared/components/navigation-bar/navigation-bar.module';
import { ImageSelectorComponent } from '@shared/components/image-selector/image-selector.component';
import { TableFilterFormModule } from '@shared/components/table-filter-form/table-filter-form.module';
import { MultipleSelectModule } from '@shared/components/multiple-select/multiple-select.module';
import { CopyButtonComponent } from '@shared/components/copy-button/copy-button.component';

import { StatusBarComponent } from './status-bar/status-bar.component';
import { StatusTextComponent } from './status-text/status-text.component';
import { MaterialModule } from '../material.module';
import { MessageBoxComponent } from './message-box/message-box.component';
import { InfoHintComponent } from './info-hint/info-hint.component';
import { HelpTooltipModule } from './help-tooltip/help-tooltip.module';
import { TipComponent } from './tip/tip.component';
import { ProjectFullNameComponent } from './project-full-name/project-full-name.component';
import { RunningInferenceOverlayComponent } from './running-inference-overlay/running-inference-overlay.component';
import { MetricThresholdComponent } from './metric-threshold/metric-threshold.component';
import { PageWithActionsComponent } from './page-with-actions/page-with-actions.component';
import { TargetMachineStatusComponent } from './target-machine-status/target-machine-status.component';
import { ExpansionTipComponent } from './expansion-tip/expansion-tip.component';
import { SwitchButtonComponent } from './switch-button/switch-button.component';
import { TextOverflowComponent } from './text-overflow/text-overflow.component';
import { HeatmapComponent } from './heatmap/heatmap.component';
import { TableSortIconComponent } from './table-sort-icon/table-sort-icon.component';
import { LayerPropertiesComponent } from './layer-properties/layer-properties.component';
import { SelectAutocompleteComponent } from './select-autocomplete/select-autocomplete.component';
import { ColorLabelComponent } from './color-label/color-label.component';
import { ProgressPanelComponent } from './progress-panel/progress-panel.component';
import { PanelComponent } from './panel/panel.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { DimensionsInputComponent } from './dimensions-input/dimensions-input.component';
import { DimensionsLayoutsComponent } from './dimensions-layouts/dimensions-layouts.component';

@NgModule({
  declarations: [
    ...pipes,
    StatusBarComponent,
    StatusTextComponent,
    MessageBoxComponent,
    InfoHintComponent,
    MasterDetailComponent,
    ModelDetailsComponent,
    ParameterDetailsComponent,
    ProjectFullNameComponent,
    TipComponent,
    RunningInferenceOverlayComponent,
    MetricThresholdComponent,
    ConfigFormFieldComponent,
    PageWithActionsComponent,
    TargetMachineStatusComponent,
    ExpansionTipComponent,
    SwitchButtonComponent,
    TextOverflowComponent,
    HeatmapComponent,
    RatioBarComponent,
    TableSortIconComponent,
    LayerPropertiesComponent,
    SelectAutocompleteComponent,
    ColorLabelComponent,
    FileUploadFieldComponent,
    ImageSelectorComponent,
    CopyButtonComponent,
    ProgressPanelComponent,
    PanelComponent,
    SpinnerComponent,
    ConfirmDialogComponent,
    DimensionsInputComponent,
    DimensionsLayoutsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    HelpTooltipModule,
    DirectivesModule,
    ButtonModule,
    ReactiveFormsModule,
    FormsModule,
    ScrollingModule,
    MarkdownTextModule,
    NavigationBarModule,
    MultipleSelectModule,
  ],
  exports: [
    /* Pipes */
    ...pipes,
    /* Components */
    StatusBarComponent,
    StatusTextComponent,
    MessageBoxComponent,
    InfoHintComponent,
    MasterDetailComponent,
    ModelDetailsComponent,
    ParameterDetailsComponent,
    MetricThresholdComponent,
    ConfigFormFieldComponent,
    ProjectFullNameComponent,
    TipComponent,
    PageWithActionsComponent,
    TargetMachineStatusComponent,
    ExpansionTipComponent,
    SwitchButtonComponent,
    TextOverflowComponent,
    HeatmapComponent,
    RatioBarComponent,
    TableSortIconComponent,
    LayerPropertiesComponent,
    SelectAutocompleteComponent,
    ColorLabelComponent,
    FileUploadFieldComponent,
    ImageSelectorComponent,
    CopyButtonComponent,
    SpinnerComponent,
    ConfirmDialogComponent,
    ProgressPanelComponent,
    PanelComponent,
    /* Modules */
    HelpTooltipModule,
    DirectivesModule,
    MarkdownTextModule,
    ButtonModule,
    NavigationBarModule,
    TableFilterFormModule,
    MultipleSelectModule,
    DimensionsInputComponent,
    DimensionsLayoutsComponent,
  ],
  providers: [DatePipe],
})
export class SharedComponentsModule {}
