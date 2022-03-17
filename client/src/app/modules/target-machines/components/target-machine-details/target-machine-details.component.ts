import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

import { IParameter } from '@shared/components/model-details/parameter-details/parameter-details.component';
import { ProxySettings, TargetMachineItem } from '@shared/models/pipelines/target-machines/target-machine';

@Component({
  selector: 'wb-target-machine-details',
  templateUrl: './target-machine-details.component.html',
  styleUrls: ['./target-machine-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetMachineDetailsComponent {
  private _machine: TargetMachineItem = null;
  @Input() set machine(value: TargetMachineItem) {
    this._machine = value;
    this.updateParams();
  }

  get machine(): TargetMachineItem {
    return this._machine;
  }

  public machineInformationParameters: IParameter[] = [];
  public proxyParameters: IParameter[] = [];

  constructor(private messagesService: MessagesService) {}

  public getFullTargetMachineName = TargetMachineItem.getFullTargetMachineName;

  public updateParams() {
    if (!this._machine) {
      return;
    }
    this.proxyParameters = this.getProxyParameters(this._machine);
    this.machineInformationParameters = this.getMachineInformationParameters(this._machine);
  }

  getProxyParameters({ httpProxy, httpsProxy }: TargetMachineItem): IParameter[] {
    const tooltips = this.messagesService.tooltipMessages.targetMachineForm;
    const notConfiguredLabel = 'Not Configured';
    return [
      { label: 'HTTP', tooltip: tooltips.httpProxy, value: ProxySettings.getProxyUrl(httpProxy) || notConfiguredLabel },
      {
        label: 'HTTPS',
        tooltip: tooltips.httpsProxy,
        value: ProxySettings.getProxyUrl(httpsProxy) || notConfiguredLabel,
      },
    ].filter((v) => !!v);
  }

  getMachineInformationParameters({ machineInfo }: TargetMachineItem): IParameter[] {
    const tooltips = this.messagesService.tooltipMessages.targetMachinePage;
    return [
      { label: 'OS', tooltip: tooltips.os, value: machineInfo && machineInfo.os },
      {
        label: 'Root Privilege',
        tooltip: tooltips.rootPrivileges,
        value: !machineInfo ? null : machineInfo.hasRootPrivileges ? 'Available' : 'Not Available',
      },
      {
        label: 'Internet Connection',
        tooltip: tooltips.internetConnection,
        value: !machineInfo ? null : machineInfo.hasInternetConnection ? 'Available' : 'Not Available',
      },
      { label: 'Python Version', tooltip: tooltips.pythonVersion, value: machineInfo && machineInfo.pythonVersion },
    ].filter((v) => !!v);
  }
}
