import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-requester-filters',
  templateUrl: './requester-filters.component.html',
  styleUrls: ['./requester-filters.component.scss'],
})
export class RequesterFiltersComponent {

  @Input() filters: FormGroup;
  @Input() exportDisabled = false;
  @Output() exportClicked = new EventEmitter();
}

