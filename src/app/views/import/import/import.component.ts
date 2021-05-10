import { Component, OnInit } from '@angular/core';
import { UploadState } from 'src/app/core/models/enums/upload-state.enum';
import { INotification } from 'src/app/core/models/interfaces/notification.interface';
import { IUploadStatus } from 'src/app/core/models/interfaces/upload-status';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { FileUploadService } from 'src/app/core/services/file-upload.service';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss'],
})
export class ImportComponent implements OnInit {

  file: File;
  errorFile: Blob;
  progress: IUploadStatus;
  notification: INotification;

  constructor(
    private fileService: FileUploadService,
    private error: ErrorHandlerService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() { }

  fileSelected(file: File) {
    this.file = file;
    this.progress = null;
    if (this.file) {
      this.notification = null;
      this.errorFile = null;
    }
  }

  uploadFile() {
    this.fileService.uploadFile(this.file)
      .subscribe(
        event => {
          this.progress = event;
          if (event.state === UploadState.done) {
            if (event.result && event.result instanceof Blob) {
              this.errorFile = event.result;
              this.notification = this.notificationService.warning({
                title: 'import.notifications.partialTitle',
                message: 'import.notifications.partial'
              });
            } else {
              this.notificationService.success({ message: 'import.notifications.success' });
            }
          }
        },
        err => {
          this.progress = null;
          this.notification = this.error.handlerResponseError(err);
        }
      );
  }

  downloadResult() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(this.errorFile);
    a.download = 'processing_errors.csv';
    a.click();
  }

}
