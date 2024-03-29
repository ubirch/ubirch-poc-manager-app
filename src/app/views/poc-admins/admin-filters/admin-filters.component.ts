import { Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { AdminStatus, AdminStatusTranslation } from 'src/app/core/models/enums/admin-status.enum';

@Component({
  selector: 'app-admin-filters',
  templateUrl: './admin-filters.component.html',
  styleUrls: ['./admin-filters.component.scss'],
})
export class AdminFiltersComponent {
  @Input() filters: UntypedFormGroup;
  @Input() exportDisabled = false;

  statuses: string[] = [AdminStatus.completed, AdminStatus.pending, AdminStatus.processing, AdminStatus.aborted];
  AdminStatusTranslation = AdminStatusTranslation;
}
