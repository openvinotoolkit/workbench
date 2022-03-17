import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wb-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelComponent {
  @Input() showContent = true;
  @Input() showFooter = false;
}
