import { Injectable } from '@angular/core';

import { Store } from '@ngrx/store';

import { RootStoreState } from '@store';
import { uploadModelFailure } from '@store/model-store/model.actions';
import { uploadDatasetFailure } from '@store/dataset-store/dataset.actions';

import { UploadRestService } from './upload-rest.service';

@Injectable({
  providedIn: 'root',
})
export class UploadFileService {
  BYTES_PER_CHUNK = 1024 * 1024 * 10;

  constructor(
    private uploadRestService: UploadRestService,
    private store$: Store<RootStoreState.State> // TODO remove store$ - upload errors are handled in effects
  ) {}

  public recursiveUploadModel(modelId: number, file: File, fileId: number): Promise<void> {
    const newChunkCB = this.uploadRestService.newModelChunk.bind(this.uploadRestService);
    return this.recursiveUpload(0, this.BYTES_PER_CHUNK, file, fileId, newChunkCB).catch((err) => {
      this.store$.dispatch(uploadModelFailure({ id: modelId, error: err }));
    });
  }

  public recursiveUploadDataset(datasetId: number, file: File, fileId: number): Promise<void> {
    const newChunkCB = this.uploadRestService.newDatasetChunk.bind(this.uploadRestService);
    return this.recursiveUpload(0, this.BYTES_PER_CHUNK, file, fileId, newChunkCB).catch((err) => {
      this.store$.dispatch(uploadDatasetFailure({ id: datasetId, error: err }));
    });
  }

  public recursiveUploadTokenizerFile(tokenizerId: number, file: File, fileId: number): Promise<void> {
    const newChunkCB = this.uploadRestService.newFileChunk.bind(this.uploadRestService);
    return this.recursiveUpload(0, this.BYTES_PER_CHUNK, file, fileId, newChunkCB);
  }

  public recursiveUploadTestImage(file: File, fileId: number): Promise<void> {
    const newChunkCB = this.uploadRestService.newTestImageChunk.bind(this.uploadRestService);
    return this.recursiveUpload(0, this.BYTES_PER_CHUNK, file, fileId, newChunkCB);
  }

  // current implementation is not cancellable, on artifact upload cancellation, recursive uploads function still
  // executes in background
  // todo: make upload cancellable
  private recursiveUpload(
    start: number,
    end: number,
    blob: File,
    fileId: number,
    restCB: (id, formData: FormData) => Promise<void>
  ): Promise<void> {
    if (start > blob.size) {
      return Promise.resolve();
    }

    return restCB(fileId, this.formData(start, end, blob)).then(() => {
      start = end;
      end = start + this.BYTES_PER_CHUNK;
      return this.recursiveUpload(start, end, blob, fileId, restCB);
    });
  }

  private formData(start: number, end: number, blob): FormData {
    let chunk;
    if ('mozSlice' in blob) {
      chunk = blob.mozSlice(start, end);
    } else if ('slice' in blob) {
      chunk = blob.slice(start, end);
    } else {
      chunk = blob.webkitSlice(start, end);
    }

    const fd = new FormData();
    fd.append('file', chunk);
    fd.append('name', blob.name);
    return fd;
  }
}
