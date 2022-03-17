import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  ViewChild,
  HostListener,
  ElementRef,
  EventEmitter,
  DoCheck,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

import { chunk } from 'lodash';

import { IUploadingImage } from '@store/dataset-store/dataset.model';

@Component({
  selector: 'wb-images-preview',
  templateUrl: './images-preview.component.html',
  styleUrls: ['./images-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagesPreviewComponent implements DoCheck {
  private readonly _emptyImagePlaceholder = { id: null, src: null, name: null } as IUploadingImage;

  @Input() set images(value: IUploadingImage[]) {
    this._images = [this._emptyImagePlaceholder, ...value];
    this.refreshImagesGrid(true);
  }

  private _images: IUploadingImage[] = [];
  private _cachedOffsetWidth: number;
  readonly imageSize = 150;

  @Input() selectedId: number = null;

  @Output() removeImageEvent = new EventEmitter<{ image: IUploadingImage }>();

  @Output() addImageEvent = new EventEmitter<void>();

  readonly dataSource = new MatTableDataSource<IUploadingImage[]>();

  @ViewChild(CdkVirtualScrollViewport) private _virtualScrollViewport: CdkVirtualScrollViewport;

  constructor(private _el: ElementRef) {}

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.refreshImagesGrid();
  }

  ngDoCheck(): void {
    this.refreshImagesGrid();
  }

  refreshImagesGrid(force = false): void {
    const offsetWidth = this._el.nativeElement.offsetWidth;

    if (offsetWidth !== this._cachedOffsetWidth || force) {
      this.dataSource.data = this._chunk([...this._images], offsetWidth, this.imageSize);
      this._virtualScrollViewport?.checkViewportSize();
      this._cachedOffsetWidth = offsetWidth;
    }
  }

  private _chunk(value: IUploadingImage[], boxWidth: number, itemWidth: number): IUploadingImage[][] {
    const imageGap = 65;
    return chunk(value, Math.floor((boxWidth - imageGap) / itemWidth));
  }

  trackBy(index: number, item: IUploadingImage[]): string {
    return item.map((i) => i.name).join(',');
  }

  removeImage(image): void {
    this.removeImageEvent.emit({ image });
  }
}
