import { Directive, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';

import { flatten } from 'lodash';

interface IEntry {
  file(resolve: (value: File) => void, reject: () => void): void;
}

const fileEntryToFile = (entry: IEntry): Promise<File> =>
  new Promise<File>((resolve, reject) => entry.file(resolve, reject));

const scanFiles = (item) =>
  new Promise<File[]>(async (resolve, reject) => {
    if (item.isFile) {
      return resolve([await fileEntryToFile(item)]);
    }

    const directoryReader = item.createReader();
    directoryReader.readEntries(async function onSuccess(entries) {
      const filesPromises = entries.filter((entry) => entry.isFile).map(fileEntryToFile);
      resolve(await Promise.all(filesPromises));
    }, reject);
  });

@Directive({
  selector: '[wbDropArea]',
})
export class DropAreaDirective {
  @Input() disabled = false;

  @Output('wbDropArea') fileDrop = new EventEmitter<File[]>();

  @HostBinding('class.wb-drop-area-active') active = false;

  @HostListener('drop', ['$event'])
  async onDrop(event: DragEvent) {
    event.preventDefault();
    if (this.disabled) {
      return;
    }
    this.active = false;
    const { dataTransfer } = event;
    if (dataTransfer.items) {
      const dataTransferLength = dataTransfer.items.length;
      const bucket = [];
      for (let i = 0; i < dataTransferLength; i++) {
        const item = dataTransfer.items[i].webkitGetAsEntry();
        bucket.push(scanFiles(item));
      }
      const files = await Promise.all(bucket);
      this.fileDrop.emit(flatten(files));
    } else {
      const files = dataTransfer.files;
      dataTransfer.clearData();
      this.fileDrop.emit(Array.from(files));
    }
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.disabled) {
      return;
    }

    this.active = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(): void {
    this.active = false;
  }
}
