import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

@Component({
  selector: 'wb-image-selector',
  templateUrl: './image-selector.component.html',
  styleUrls: ['./image-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageSelectorComponent {
  @Input() acceptExtensions: string = null;

  @Input() typeError = false;

  @Input() disabled = false;

  @Output() fileChange = new EventEmitter<File>();

  hints = this._messagesService.hintMessages.networkOutputVisualization;

  constructor(private _messagesService: MessagesService) {}

  fileChanged(event) {
    this._emit(event.target.files[0]);
  }

  onFileDrop(files: File) {
    this._emit(files);
  }

  private _emit(files: File) {
    this.fileChange.emit(files);
  }
}
