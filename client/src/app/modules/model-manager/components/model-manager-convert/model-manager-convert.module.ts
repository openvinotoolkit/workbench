import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { ModelManagerConvertComponent } from './model-manager-convert.component';
import { InputOutputLayerControlComponent } from './input-output-layer-control/input-output-layer-control.component';
import { HelpChecklistModule } from './help-checklist/help-checklist.module';
import { TransformationsConfigFieldComponent } from './transformations-config-field/transformations-config-field.component';

import { ConversionAdvancedParametersGroupComponent } from './conversion-advanced-parameters-group/conversion-advanced-parameters-group.component';
import { ConversionConfigurationFilesGroupComponent } from './conversion-configuration-files-group/conversion-configuration-files-group.component';
import { ConversionGeneralParametersGroupComponent } from './conversion-general-parameters-group/conversion-general-parameters-group.component';
import { ConversionInputsGroupComponent } from './conversion-inputs-group/conversion-inputs-group.component';
import { TipsListComponent } from './tips-list/tips-list.component';

@NgModule({
  declarations: [
    ModelManagerConvertComponent,

    ConversionAdvancedParametersGroupComponent,
    ConversionConfigurationFilesGroupComponent,
    ConversionGeneralParametersGroupComponent,
    ConversionInputsGroupComponent,

    InputOutputLayerControlComponent,
    TransformationsConfigFieldComponent,
    TipsListComponent,
  ],
  imports: [CommonModule, SharedModule, HelpChecklistModule],
  exports: [ModelManagerConvertComponent],
})
export class ModelManagerConvertModule {}
