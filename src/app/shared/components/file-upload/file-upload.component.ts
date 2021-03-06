import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { fromEvent, merge, Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { UploadState } from 'src/app/core/models/enums/upload-state.enum';
import { IUploadStatus } from 'src/app/core/models/interfaces/upload-status.interface';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadComponent implements AfterViewInit {
  file: File;
  accept = '.csv';
  draggedOver = false;
  uploadStates = UploadState;

  @ViewChild('input') input: ElementRef;
  @ViewChild('drop') drop: ElementRef;

  // tslint:disable-next-line:variable-name
  private _progress: IUploadStatus;
  get progress() { return this._progress; }
  @Input() set progress(value: IUploadStatus) {
    this._progress = value;
    if (value?.state === UploadState.done) { this.resetUpload(); }
  }

  @Output() fileSelected = new EventEmitter<File>();

  fileDropped$: Observable<any>;

  get disabled(): boolean { return [UploadState.inPorgress, this.uploadStates.pending].includes(this.progress?.state); }
  get fileSize(): number { return this.file?.size; }
  get fileName(): string { return this.file?.name ?? 'import.filePlaceholder'; }

  constructor() { }

  ngAfterViewInit(): void {
    merge(
      fromEvent(this.drop.nativeElement, 'dragover').pipe(filter(v => !this.disabled)),
      fromEvent(this.drop.nativeElement, 'dragenter').pipe(
        filter(v => !this.disabled),
        tap(() => this.draggedOver = true)
      ),
      fromEvent(this.drop.nativeElement, 'dragleave').pipe(
        filter(v => !this.disabled),
        tap(() => this.draggedOver = false)
      ),
      fromEvent(this.drop.nativeElement, 'drop').pipe(
        filter(v => !this.disabled),
        tap((event: DragEvent) => {
          const filesList = event.dataTransfer?.files;
          for (let i = 0; i < filesList?.length ?? 0; i++) {
            const file = filesList.item(i);
            if (file.type === 'text/csv') {
              this.file = file;
              this.fileChanaged();
              this.draggedOver = false;
              return;
            }
          }
        })
      ),
    ).subscribe(
      (event: DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
      });

  }

  triggerrFileSelect() {
    this.input.nativeElement.click();
  }

  selected(event) {
    this.file = event?.target?.files?.[0];
    this.fileChanaged();
  }

  fileDropped(event) {
    event.preventDefault();
  }

  private fileChanaged() {
    this.fileSelected.emit(this.file);
  }

  private resetUpload() {
    this.file = undefined;
    this.fileChanaged();
    this.input.nativeElement.value = '';
  }



}
