import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { scan } from 'rxjs/operators';
import { UploadState } from '../models/enums/upload-state.enum';
import { IUploadStatus } from '../models/interfaces/upload-status';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  constructor(private http: HttpClient) { }

  postUrl = 'http://localhost:8000/upload';

  uploadFile(file: File): Observable<IUploadStatus> {
    const myFormData: FormData = new FormData();
    myFormData.append('file', file, file.name);

    const config = new HttpRequest('POST', this.postUrl, myFormData, {
      reportProgress: true,
      responseType: 'text'
    });

    return this.http.request(config).pipe(
      scan((acc, resp) => {
        if (isHttpProgressEvent(resp)) {
          return {
            progress: resp.total ? Math.round((100 * resp.loaded) / resp.total) : acc.progress,
            state: UploadState.inPorgress,
          } as IUploadStatus;
        } else if (isHttpResponse(resp)) {
          return {
            progress: 100,
            state: UploadState.done,
            result: resp.body
          } as IUploadStatus;
        }
        return acc;
      },
        { state: UploadState.pending, progress: 0, result: null })
    );
  }
}

export function isHttpResponse<T>(event: HttpEvent<T>): event is HttpResponse<T> {
  return event.type === HttpEventType.Response;
}

export function isHttpProgressEvent(
  event: HttpEvent<unknown>
): event is HttpProgressEvent {
  return (
    event.type === HttpEventType.DownloadProgress ||
    event.type === HttpEventType.UploadProgress
  );
}
