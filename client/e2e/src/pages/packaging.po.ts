import { ElementFinder, protractor } from 'protractor';

import { OSTypeNames } from '@shared/models/device';

import { TestUtils } from './test-utils';

export class PackingModel {
  CPU: boolean;
  GPU: boolean;
  VPU: boolean;
  includeModel: boolean;
  baseName: string;
  projectId: number;
  os: string;

  constructor() {
    this.CPU = false;
    this.GPU = false;
    this.VPU = false;
    this.includeModel = false;
    this.projectId = -1;
    this.os = OSTypeNames.UBUNTU18;
    this.baseName = `${this.os}_deployment_package_`;
  }
}

export class PackingSheet {
  until = protractor.ExpectedConditions;

  get cpuCheckBox() {
    return TestUtils.getElementByDataTestId('tab-packaging-checkbox-CPU');
  }

  get gpuCheckBox() {
    return TestUtils.getElementByDataTestId('tab-packaging-checkbox-GPU');
  }

  get vpuCheckBox() {
    return TestUtils.getElementByDataTestId('tab-packaging-checkbox-MYRIAD');
  }

  get includeModel() {
    return TestUtils.getElementByDataTestId('tab-packaging-include-model');
  }

  get packButton() {
    return TestUtils.getElementByDataTestId('tab-packaging-button-pack');
  }

  async getOSRadioButton(os: OSTypeNames): Promise<ElementFinder> {
    return TestUtils.getElementByDataTestId(os);
  }

  packingName(packing: PackingModel, modelName?: string) {
    let name = packing.baseName;
    if (packing.CPU) {
      name += 'CPU_';
    }
    if (packing.GPU) {
      name += 'GPU_';
    }
    if (packing.VPU) {
      name += 'VPU_';
    }
    if (packing.includeModel) {
      name += `with_model_${modelName}`;
    } else {
      name += 'w_o_model';
    }
    return name;
  }
}
