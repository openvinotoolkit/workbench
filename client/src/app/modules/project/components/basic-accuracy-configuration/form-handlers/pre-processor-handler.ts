import { FormGroup, Validators } from '@angular/forms';

import { ModelItem, ModelTaskTypes } from '@store/model-store/model.model';

import {
  IAutoResizePreProcessor,
  IFreeFormMaskPreProcessor,
  IPreProcessor,
  IRectMaskPreProcessor,
  PreProcessorType,
} from '@shared/models/accuracy/pre-processor';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

import { createControl, IFormFeatureHandler, Subscriptions } from './index';

export class PreProcessorGroupHandler implements IFormFeatureHandler<IPreProcessor[]> {
  readonly group = new FormGroup({});

  readonly handlers: {
    auto_resize: AutoResizePreProcessorHandler;
    inpainting_mask?: InpaintingMaskPreProcessorHandler;
  } = {
    auto_resize: new AutoResizePreProcessorHandler(),
  };

  orderedFields: { field: AdvancedConfigField; group: FormGroup }[] = [];

  private readonly _subs = new Subscriptions();

  static isApplicable(): boolean {
    return true;
  }

  constructor(taskType: ModelTaskTypes, model: ModelItem, visualize = false) {
    if (taskType === ModelTaskTypes.INPAINTING) {
      this.handlers.inpainting_mask = visualize
        ? new VisualizationInpaintingMaskPreProcessorHandler()
        : new InpaintingMaskPreProcessorHandler();
    }

    Object.entries(this.handlers).forEach(([key, handler]) => this.group.addControl(key, handler.group));

    this._subs.add = this.group.valueChanges.subscribe(() => this._setOrderedFields(visualize));

    this.setValue((visualize ? model.visualizationConfiguration : model.accuracyConfiguration).preprocessing);
    this._setOrderedFields(visualize);
  }

  private _setOrderedFields(visualize: boolean) {
    this.orderedFields = visualize ? [] : [...this.handlers.auto_resize.orderedFields];

    if (this.handlers.inpainting_mask) {
      this.orderedFields = [...this.orderedFields, ...this.handlers.inpainting_mask.orderedFields];
    }
  }

  setValue(preprocessing: IPreProcessor[] = []) {
    preprocessing.forEach((p) => {
      if (p.type === PreProcessorType.AUTO_RESIZE) {
        this.handlers.auto_resize?.setValue(p);
      }
      if (p.type === PreProcessorType.RECT_MASK || p.type === PreProcessorType.FREE_FORM_MASK) {
        this.handlers.inpainting_mask?.setValue(p);
      }
    });
  }

  getValue(): IPreProcessor[] {
    return Object.values(this.handlers)
      .filter((v) => !!v)
      .map((handler) => handler.getValue())
      .filter((v) => !!v);
  }

  destroy(): void {
    this._subs.unsubscribe();
    Object.values(this.handlers).forEach((h) => h.destroy());
  }
}

export class AutoResizePreProcessorHandler implements IFormFeatureHandler<IAutoResizePreProcessor> {
  private readonly _fields: { auto_resize: AdvancedConfigField } = {
    auto_resize: {
      type: 'select',
      label: 'Resize Type',
      name: 'auto_resize',
      value: 'Auto',
      options: ['Auto'],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'resize.size',
      },
    },
  };

  readonly group = new FormGroup({
    auto_resize: createControl(this._fields['auto_resize']),
  });

  orderedFields: { field: AdvancedConfigField; group: FormGroup }[] = [
    { field: this._fields['auto_resize'], group: this.group },
  ];

  setValue(_: IAutoResizePreProcessor) {}

  getValue(): IAutoResizePreProcessor {
    return { type: PreProcessorType.AUTO_RESIZE };
  }

  destroy() {}
}

export class InpaintingMaskPreProcessorHandler
  implements IFormFeatureHandler<IRectMaskPreProcessor | IFreeFormMaskPreProcessor> {
  protected readonly _fields: {
    mask_type: AdvancedConfigField;
    parts: AdvancedConfigField;
    max_brush_width: AdvancedConfigField;
    max_length: AdvancedConfigField;
    max_vertex: AdvancedConfigField;
    dst_width: AdvancedConfigField;
    dst_height: AdvancedConfigField;
    inverse_mask: AdvancedConfigField;
  } = {
    mask_type: {
      type: 'select',
      label: 'Mask Type',
      name: 'mask_type',
      value: 'rect_mask',
      options: [
        { name: 'Rectangle', value: PreProcessorType.RECT_MASK },
        { name: 'Free-form', value: PreProcessorType.FREE_FORM_MASK },
      ],
      validators: [Validators.required],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'mask_type',
      },
    },
    parts: {
      type: 'input',
      label: 'Number of parts',
      name: 'parts',
      value: 4,
      numberType: 'integer',
      validators: [Validators.required, Validators.min(1)],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'free_form_mask.parts',
      },
    },
    max_brush_width: {
      type: 'input',
      label: 'Max Brush Width',
      name: 'max_brush_width',
      value: 10,
      numberType: 'integer',
      validators: [Validators.required, Validators.min(1)],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'free_form_mask.max_brush_width',
      },
    },
    max_length: {
      type: 'input',
      label: 'Max Length',
      name: 'max_length',
      value: 10,
      numberType: 'integer',
      validators: [Validators.required, Validators.min(1)],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'free_form_mask.max_length',
      },
    },
    max_vertex: {
      type: 'input',
      label: 'Max Vertex Count',
      name: 'max_vertex',
      value: 4,
      numberType: 'integer',
      validators: [Validators.required, Validators.min(3)],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'free_form_mask.max_vertex',
      },
    },
    dst_width: {
      type: 'input',
      label: 'Mask width',
      name: 'dst_width',
      value: 10,
      numberType: 'integer',
      validators: [Validators.required, Validators.min(1)],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'rect_mask.dst_width',
      },
    },
    dst_height: {
      type: 'input',
      label: 'Mask height',
      name: 'dst_height',
      value: 10,
      numberType: 'integer',
      validators: [Validators.required, Validators.min(1)],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'rect_mask.dst_height',
      },
    },
    inverse_mask: {
      type: 'radio',
      label: 'Inverse mask',
      name: 'inverse_mask',
      value: false,
      options: [
        { name: 'No', value: false },
        { name: 'Yes', value: true },
      ],
      tooltip: {
        prefix: 'accuracyParams',
        value: 'free_form_mask.inverse_mask',
      },
    },
  };

  readonly group = new FormGroup({
    mask_type: createControl(this._fields['mask_type']),
  });

  orderedFields: { field: AdvancedConfigField; group: FormGroup }[] = [];

  private readonly _subs = new Subscriptions();

  constructor() {
    this._subs.add = this.group.controls['mask_type'].valueChanges.subscribe(
      (maskType: PreProcessorType.RECT_MASK | PreProcessorType.FREE_FORM_MASK) => {
        if (maskType === PreProcessorType.RECT_MASK) {
          this.group.removeControl('free_form_mask');
          this.group.addControl('rect_mask', this.rectFormMaskGroup());
        } else {
          this.group.removeControl('rect_mask');
          this.group.addControl('free_form_mask', this.freeFormMaskGroup());
        }
        this._setOrderedFields();
      }
    );
    this.group.controls['mask_type'].setValue(PreProcessorType.RECT_MASK);
  }

  protected _setOrderedFields() {
    const maskType: PreProcessorType.RECT_MASK | PreProcessorType.FREE_FORM_MASK = this.group.controls['mask_type']
      .value;

    const freeFormMaskGroup = this.group.controls['free_form_mask'] as FormGroup;
    const rectMaskGroup = this.group.controls['rect_mask'] as FormGroup;

    const maskFields: { field: AdvancedConfigField; group: FormGroup }[] =
      maskType === PreProcessorType.FREE_FORM_MASK
        ? [
            { field: this._fields['parts'], group: freeFormMaskGroup },
            { field: this._fields['max_brush_width'], group: freeFormMaskGroup },
            { field: this._fields['max_length'], group: freeFormMaskGroup },
            { field: this._fields['max_vertex'], group: freeFormMaskGroup },
            { field: this._fields['inverse_mask'], group: freeFormMaskGroup },
          ]
        : [
            { field: this._fields['dst_width'], group: rectMaskGroup },
            { field: this._fields['dst_height'], group: rectMaskGroup },
            { field: this._fields['inverse_mask'], group: rectMaskGroup },
          ];

    this.orderedFields = [{ field: this._fields['mask_type'], group: this.group }, ...maskFields];
  }

  freeFormMaskGroup() {
    return new FormGroup({
      parts: createControl(this._fields['parts']),
      max_brush_width: createControl(this._fields['max_brush_width']),
      max_length: createControl(this._fields['max_length']),
      max_vertex: createControl(this._fields['max_vertex']),
      inverse_mask: createControl(this._fields['inverse_mask']),
    });
  }

  rectFormMaskGroup() {
    return new FormGroup({
      dst_width: createControl(this._fields['dst_width']),
      dst_height: createControl(this._fields['dst_height']),
      inverse_mask: createControl(this._fields['inverse_mask']),
    });
  }

  setValue(preprocessor: IRectMaskPreProcessor | IFreeFormMaskPreProcessor) {
    if (!preprocessor) {
      this.group.controls['mask_type'].setValue(PreProcessorType.RECT_MASK);
    }

    if (preprocessor.type === PreProcessorType.RECT_MASK) {
      this.group.controls['mask_type'].setValue(PreProcessorType.RECT_MASK);
      this.group.controls['rect_mask'].patchValue({
        dst_width: preprocessor.dst_width,
        dst_height: preprocessor.dst_height,
        inverse_mask: preprocessor.inverse_mask,
      });
    }

    if (preprocessor.type === PreProcessorType.FREE_FORM_MASK) {
      this.group.controls['mask_type'].setValue(PreProcessorType.FREE_FORM_MASK);
      this.group.controls['free_form_mask'].patchValue({
        parts: preprocessor.parts,
        max_brush_width: preprocessor.max_brush_width,
        max_length: preprocessor.max_length,
        max_vertex: preprocessor.max_vertex,
        inverse_mask: preprocessor.inverse_mask,
      });
    }
  }

  getValue(): IRectMaskPreProcessor | IFreeFormMaskPreProcessor {
    if (!this.group.valid) {
      return null;
    }

    const maskType: PreProcessorType.RECT_MASK | PreProcessorType.FREE_FORM_MASK = this.group.controls['mask_type']
      .value;

    if (maskType === PreProcessorType.RECT_MASK) {
      const value = this.group.controls['rect_mask'].value;
      return {
        type: PreProcessorType.RECT_MASK,
        dst_width: value.dst_width,
        dst_height: value.dst_height,
        inverse_mask: value.inverse_mask,
      };
    }

    if (maskType === PreProcessorType.FREE_FORM_MASK) {
      const value = this.group.controls['free_form_mask'].value;
      return {
        type: PreProcessorType.FREE_FORM_MASK,
        parts: value.parts,
        max_brush_width: value.max_brush_width,
        max_length: value.max_length,
        max_vertex: value.max_vertex,
        inverse_mask: value.inverse_mask,
      };
    }
  }

  destroy() {
    this._subs.unsubscribe();
  }
}

class VisualizationInpaintingMaskPreProcessorHandler extends InpaintingMaskPreProcessorHandler {
  protected _setOrderedFields() {
    const maskType: PreProcessorType.RECT_MASK | PreProcessorType.FREE_FORM_MASK = this.group.controls['mask_type']
      .value;

    const freeFormMaskGroup = this.group.controls['free_form_mask'] as FormGroup;
    const rectMaskGroup = this.group.controls['rect_mask'] as FormGroup;

    this.orderedFields =
      maskType === PreProcessorType.FREE_FORM_MASK
        ? [{ field: this._fields['inverse_mask'], group: freeFormMaskGroup }]
        : [{ field: this._fields['inverse_mask'], group: rectMaskGroup }];
  }
}
