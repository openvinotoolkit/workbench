import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BoxPainter } from './box-painter';
import { PaintingCanvasManagerService } from '../../painting-canvas-manager.service';

@Component({
  selector: 'wb-painting-canvas',
  templateUrl: './painting-canvas.component.html',
  styleUrls: ['./painting-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaintingCanvasComponent implements OnInit, OnDestroy {
  @Input() width: number;
  @Input() height: number;

  @ViewChild('canvasElement') set canvasRef(value: ElementRef<HTMLCanvasElement>) {
    if (!value) {
      return;
    }

    this._renderer = new BoxPainter(value.nativeElement);
    this._renderer.start();
  }

  tipShown = true;

  private _renderer: BoxPainter;

  private readonly _unsubscribe$ = new Subject<void>();

  @HostListener('mousedown') onClick() {
    this.tipShown = false;
    this._paintingCanvasManagerService.clearDisabled$.next(false);
  }

  constructor(private _paintingCanvasManagerService: PaintingCanvasManagerService) {
    this._paintingCanvasManagerService.clear$.pipe(takeUntil(this._unsubscribe$)).subscribe(() => this.clear());
  }

  ngOnInit() {
    this._paintingCanvasManagerService.available$.next(true);
  }

  ngOnDestroy() {
    this._renderer.stop();
    this._renderer.clear();
    this._paintingCanvasManagerService.available$.next(false);
    this._paintingCanvasManagerService.clearDisabled$.next(true);
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  clear() {
    this._renderer.clear();
    this.tipShown = true;
    this._paintingCanvasManagerService.clearDisabled$.next(true);
  }

  getMaskBlob(): Promise<Blob> {
    return this._renderer.toBlob();
  }
}
