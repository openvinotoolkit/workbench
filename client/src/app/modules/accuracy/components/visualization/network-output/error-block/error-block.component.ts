import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wb-error-block',
  templateUrl: './error-block.component.html',
  styleUrls: ['./error-block.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorBlockComponent {
  @Input() title: string = null;

  @Input() error: string = null;

  expanded = false;
}
