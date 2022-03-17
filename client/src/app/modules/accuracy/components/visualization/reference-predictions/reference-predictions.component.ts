import { AfterViewInit, ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';

import { ModelTaskTypes } from '@store/model-store/model.model';

import { NetworkOutputComponent, VisualizationMode } from '../network-output/network-output.component';

@Component({
  selector: 'wb-reference-predictions',
  templateUrl: './reference-predictions.component.html',
  styleUrls: ['./reference-predictions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferencePredictionsComponent implements AfterViewInit {
  private _image: File = null;

  @Input() set image(value: File) {
    this._image = value;
    this._setImage();
  }

  get image(): File {
    return this._image;
  }

  @Input() mode: VisualizationMode = 'default';

  @Input() taskType: ModelTaskTypes;

  @ViewChild(NetworkOutputComponent) networkOutputComponent: NetworkOutputComponent;

  ngAfterViewInit(): void {
    this._setImage();
  }

  private _setImage(): void {
    if (!this._image) {
      return;
    }

    if (this.networkOutputComponent) {
      this.networkOutputComponent.onFileChange(this._image);
      this.networkOutputComponent.mode = this.mode;
    }
  }
}
