import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { HelpChecklistService } from '../help-checklist.service';

@Component({
  selector: 'wb-help-checklist-item',
  templateUrl: './help-checklist-item.component.html',
  styleUrls: ['./help-checklist-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpChecklistItemComponent {
  @Input()
  public label: string;

  @Input()
  public name: string;

  @Input()
  public checked: boolean;

  constructor(public helpChecklistService: HelpChecklistService) {}
}
