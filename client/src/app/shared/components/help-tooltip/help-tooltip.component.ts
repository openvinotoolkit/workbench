import { Component, Input } from '@angular/core';

@Component({
  selector: 'wb-help-tooltip',
  templateUrl: './help-tooltip.component.html',
  styleUrls: ['./help-tooltip.component.scss'],
})
export class HelpTooltipComponent {
  @Input()
  tooltipMessage;
}
