import { TestBed } from '@angular/core/testing';

import { ExportImportService } from './export-import.service';

describe('FileUploadService', () => {
  let service: ExportImportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExportImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
