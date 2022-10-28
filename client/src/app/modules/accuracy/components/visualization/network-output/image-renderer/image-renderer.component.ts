import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ImageRenderer } from './image-renderer';
import { PaintingCanvasComponent } from './painting-canvas/painting-canvas.component';
import { IColoredInferencePrediction } from '../network-output.component';

export enum ImageRendererDrawMode {
  BOX = 'box',
  MASK = 'mask',
  INPAINTING = 'inpainting',
  EXPLANATION = 'explanation',
}

@Component({
  selector: 'wb-image-renderer',
  templateUrl: './image-renderer.component.html',
  styleUrls: ['./image-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageRendererComponent implements OnDestroy {
  @Input() drawMode: ImageRendererDrawMode = ImageRendererDrawMode.BOX;

  @Input() set image(value: File | string) {
    this._onImageChange(value);
  }

  @Input() set predictions(value: IColoredInferencePrediction[]) {
    this._onPredictionsChange(value || []);
  }

  @ViewChild('canvasElement') canvasRef: ElementRef;
  @ViewChild(PaintingCanvasComponent) paintingCanvasComponent?: PaintingCanvasComponent;

  readonly ImageRendererDrawMode = ImageRendererDrawMode;

  explanationMask: SafeResourceUrl;

  private _renderer: ImageRenderer = null;

  constructor(private _cdr: ChangeDetectorRef, private _sanitizer: DomSanitizer) {}

  ngOnDestroy() {
    this._resetRenderer();
  }

  private _resetRenderer(): void {
    this.explanationMask = null;
    // revoke object url
    if (this._renderer) {
      this._renderer.destroy();
      this._renderer = null;
    }
  }

  getMaskBlob(): Promise<Blob> {
    if (!this.paintingCanvasComponent) {
      return Promise.resolve(null);
    }

    return this.paintingCanvasComponent.getMaskBlob();
  }

  private _onImageChange(file: File | string): void {
    this._resetRenderer();

    if (!file) {
      return;
    }

    // update canvas ngIf binding to get canvasRef
    this._cdr.detectChanges();

    this._renderer = new ImageRenderer(this.canvasRef.nativeElement, file);
    this._renderer
      .initialize()
      // after first render width and height of canvas is set
      // detect changes in order to update width and height of painting canvas
      .then(() => {
        this._renderer.render();
        this.paintingCanvasComponent?.clear();
        this._cdr.detectChanges();
      });
  }

  private async _onPredictionsChange(predictions: IColoredInferencePrediction[]): Promise<void> {
    if (!this._renderer?.initialized) {
      return;
    }

    this._renderer.render();

    if (this.drawMode === ImageRendererDrawMode.EXPLANATION) {
      if (predictions.length) {
        this.explanationMask = this._sanitizer.bypassSecurityTrustResourceUrl(
          `data:img/png;base64,${predictions?.[0]?.explanation_mask}`
        );
      }
    } else {
      this.explanationMask = null;
    }

    if (this.drawMode === ImageRendererDrawMode.BOX) {
      predictions.forEach((prediction) => {
        const label = `#${prediction.category_id}: ${prediction.score.toString().slice(0, 4)}`;
        this._renderer.drawBox(prediction.bbox, prediction.colors.primary, label);
      });
    }

    if (this.drawMode === ImageRendererDrawMode.MASK) {
      predictions.forEach((prediction) => this._renderer.drawPolygons(prediction.segmentation, prediction.colors.mask));
    }

    this._cdr.detectChanges();
  }
}
