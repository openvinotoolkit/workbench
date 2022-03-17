import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

import { TargetMachineStatusNames } from '@shared/models/pipelines/target-machines/target-machine';

@Component({
  selector: 'wb-target-machine-status',
  templateUrl: './target-machine-status.component.html',
  styleUrls: ['./target-machine-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetMachineStatusComponent {
  @Input()
  status: TargetMachineStatusNames;

  @Input()
  errorMessage: string = null;

  public readonly statusToIconMap = {
    [TargetMachineStatusNames.AVAILABLE]: 'check',
    [TargetMachineStatusNames.CONFIGURING]: 'spinner',
    [TargetMachineStatusNames.CONNECTING]: 'spinner',
    [TargetMachineStatusNames.CONFIGURATION_FAILURE]: 'warning',
    [TargetMachineStatusNames.CONNECTION_FAILURE]: 'warning',
    [TargetMachineStatusNames.NOT_CONFIGURED]: 'warning',
    [TargetMachineStatusNames.BUSY]: 'hourglass',
  };

  public readonly statusToTextMap = {
    [TargetMachineStatusNames.AVAILABLE]: 'Available',
    [TargetMachineStatusNames.CONFIGURING]: 'Configuring',
    [TargetMachineStatusNames.CONNECTING]: 'Connecting',
    [TargetMachineStatusNames.CONFIGURATION_FAILURE]: 'Configuration Failure',
    [TargetMachineStatusNames.CONNECTION_FAILURE]: 'Connection Failure',
    [TargetMachineStatusNames.NOT_CONFIGURED]: 'Not Configured',
    [TargetMachineStatusNames.BUSY]: 'Busy',
  };

  readonly errorKey = 'remote-target-machine';

  constructor(public messagesService: MessagesService) {}
}
