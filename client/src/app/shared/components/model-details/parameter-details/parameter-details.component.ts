import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { isArray, isNil } from 'lodash';

export interface ILink {
  text: string;
  url: string;
}

export interface IParameter {
  label: string;
  tooltip?: string;
  value: number | string | ILink[];
}

@Component({
  selector: 'wb-parameter-details',
  templateUrl: './parameter-details.component.html',
  styleUrls: ['./parameter-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParameterDetailsComponent {
  public isNil = isNil;
  @Input() parameter: IParameter = null;

  isLinkParameter(value: number | string | ILink[]): boolean {
    return isArray(value);
  }
}
