import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

export interface TipMessage {
  header: string;
  content: string[];
}

@Component({
  selector: 'wb-tip',
  templateUrl: './tip.component.html',
  styleUrls: ['./tip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipComponent {
  @Input()
  tipMessage: TipMessage;
}
