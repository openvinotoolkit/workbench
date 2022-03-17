import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'wb-status-text',
  templateUrl: './status-text.component.html',
  styleUrls: ['./status-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusTextComponent {
  @Input()
  icon: string;

  @Input()
  text: string;
}
