import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

import { SessionService } from '@core/services/common/session.service';
import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';
import { JupyterLabService } from '@core/services/common/jupyter-lab.service';

import { ConnectionService } from '../services/api/connection.service';

@Component({
  selector: 'wb-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() isAuthenticated: boolean;

  @Input() isJupyterAvailable: boolean;

  @Output() toggleUserInfo = new EventEmitter<void>();

  currentUrl: string;

  constructor(
    private _router: Router,
    public sessionService: SessionService,
    private _connectionService: ConnectionService,
    private _gAnalyticsService: GoogleAnalyticsService,
    private _jupyterLabService: JupyterLabService
  ) {
    this.currentUrl = this._connectionService.fullDomainPath;
  }

  goHome(): void {
    this._router.navigate(['/']);
  }

  openJupyterLab(): void {
    this._gAnalyticsService.emitOpenJupyterLabEvent();
    window.open(this._jupyterLabService.introURL, '_blank');
  }
}
