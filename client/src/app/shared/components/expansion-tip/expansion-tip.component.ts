import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wb-expansion-tip',
  templateUrl: './expansion-tip.component.html',
  styleUrls: ['./expansion-tip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpansionTipComponent {
  @Input() title: string;

  @Input() text: string;
}
