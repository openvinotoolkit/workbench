import { Component, EventEmitter, HostListener, Output, ViewChild, Input } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'wb-master-detail',
  templateUrl: './master-detail.component.html',
  styleUrls: ['./master-detail.component.scss'],
})
export class MasterDetailComponent {
  @Input()
  public mode: 'side' | 'over' = 'side';

  @Input()
  public hasBackdrop?: boolean;

  @ViewChild('detailsSidenav', { static: true })
  public detailsSidenav: MatSidenav;

  @Input() width = '50%';

  @Output()
  public closeDetails = new EventEmitter<void>();

  @HostListener('document:keyup', ['$event'])
  private handleEscapeKeyUp(event: KeyboardEvent) {
    if (this.detailsSidenav.opened && event.code === 'Escape') {
      this.detailsSidenav.close();
      this.closeDetails.emit();
    }
  }
}
