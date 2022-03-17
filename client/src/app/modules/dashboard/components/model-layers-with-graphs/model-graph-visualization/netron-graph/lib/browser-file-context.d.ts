import { WorkbenchBinaryStream } from './binary-stream';
import { WorkbenchBrowserHost } from './browser-host';

export class WorkbenchBrowserFileContext {
  constructor(host: WorkbenchBrowserHost, file: File, blobs: Blob[]);
  stream: WorkbenchBinaryStream;
  _stream: WorkbenchBinaryStream;
  open: () => Promise<void>;
  request: (fileName: string, encoding: boolean) => Promise<WorkbenchBinaryStream>;
}
