import {
  Component,
  EventEmitter,
  forwardRef,
  HostBinding,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormControl, NgControl, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Moment } from 'moment';
import * as moment from 'moment';
import { formatDate } from '@angular/common';
import { Subscription } from 'rxjs';
import { Platform } from '@ionic/angular';
import { DateAdapter } from '@angular/material/core';
import { LocaleService } from 'src/app/core/services/locale.service';

interface DateTimeUnits {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

@Component({
  selector: 'app-mat-datepicker',
  templateUrl: './mat-datepicker.component.html',
  styleUrls: ['./mat-datepicker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MatDatepickerComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MatDatepickerComponent),
      multi: true
    }
  ],
})
export class MatDatepickerComponent implements ControlValueAccessor, OnInit, OnDestroy, OnChanges {
  @Input() strict = false;
  @Input() format = 'yyyy-MM-dd';
  @Input() displayFormat = 'yyyy-MM-dd';
  @Input() placeholder = 'yyyy-MM-dd';
  @Input() language: string;
  @Input() min?: Date | 'now';
  @Input() max?: Date | 'now';
  @Input() required = false;
  @Input() invalidMessage: string;
  @Input() set disabled(disabled: boolean) {
    this._disabled = disabled;
    if (this.disabled) { this.input.disable(); }
    else { this.input.enable(); }
  }
  get disabled() { return this._disabled; }
  // tslint:disable-next-line:variable-name
  private _disabled = false;

  @Output() dateCallback = new EventEmitter<string>();

  public hostControl: NgControl;
  public input: FormControl = new FormControl();

  public date?: Date;
  public displayDate = '';
  public mask: string;
  public maskEnabled = false;
  public touchUI = false;
  public inputFocused = false;

  private onChange;
  private onTouch;
  private localeChanged$: Subscription;

  get maxDate(): Date { return this.max === 'now' ? new Date() : this.max; }
  get minDate(): Date { return this.min === 'now' ? new Date() : this.min; }
  // get placeholder() { return this.localeService.datePlaceholder; }

  @HostBinding('class.focused') get focusClass() { return this.inputFocused; }

  constructor(
    private injector: Injector,
    private platform: Platform,
    private dataAdapater: DateAdapter<any>,
  ) { }


  ngOnChanges(changes: SimpleChanges): void {
    this.dataAdapater.setLocale(this.language);
    this.mask = this.createFormatMask(this.displayFormat);
    this.updateDisplayDate();
  }

  ngOnInit(): void {
    this.hostControl = this.injector.get(NgControl);
    this.touchUI = !this.platform.is('desktop');
    this.dataAdapater.setLocale(this.language);
  }

  // Datepicker selected
  dateValueChanged(date) {
    this.date = date;
    this.updateDisplayDate();
    this.changed();
  }

  // Value typed in
  inputChanged(input: string): void {
    if (this.strict) {
      const dateChunks = this.chunkDateString(input, this.displayFormat);
      // fix month
      if (dateChunks.month > 12) {
        const monthPos = this.displayFormat.indexOf('M');
        dateChunks.month = 12;
        input = input.slice(0, monthPos) + dateChunks.month + input.slice(monthPos + 2);
      }
      // fix day
      if (dateChunks.day > 31) {
        const dayPos = this.displayFormat.indexOf('d');
        dateChunks.day = 31;
        input = input.slice(0, dayPos) + dateChunks.day + input.slice(dayPos + 2);
      }
      this.input.setValue(input);
    }
    this.changed();
  }

  changed() {
    const mom = this.getMoment();
    let value;

    if (mom.isValid()) {
      // if (this.strict) { mom = this.verifyMinMax(mom); }
      this.date = mom.toDate();
      value = formatDate(this.date, this.format, this.language);
    } else {
      this.date = undefined;
    }

    this.onChange(value);
    this.dateCallback.emit(value);
    this.onTouch();
  }

  parseDateString(input: string, format: string): Date {
    if (!this.inputMatchesFormat(input, format)) { return undefined; }

    const { year, month, day, hour, minute } = this.chunkDateString(input, format);

    if (input.endsWith('Z')) {
      return new Date(Date.UTC(year, month - 1, day, hour, minute));
    }
    return new Date(year, month - 1, day, hour, minute);
  }

  chunkDateString(value: string, format: string): DateTimeUnits {
    value = value.padEnd(format.length, '_');
    const dayPos = format.indexOf('d');
    const monthPos = format.indexOf('M');
    const yearPos = format.indexOf('y');
    const hourPos = format.indexOf('H');
    const minutePos = format.indexOf('m');

    return {
      year: +value.slice(yearPos, yearPos + 4),
      month: +value.slice(monthPos, monthPos + 2),
      day: +value.slice(dayPos, dayPos + 2),
      hour: +value.slice(hourPos, hourPos + 2),
      minute: +value.slice(minutePos, minutePos + 2),
    };
  }

  showMask() {
    this.inputFocused = true;
    if (!this.maskEnabled) { this.maskEnabled = true; }

  }
  hideMask() {
    this.inputFocused = false;
    if (!this.getUnmaskedValue(this.input.value)?.length) {
      this.maskEnabled = false;
    }
  }

  getUnmaskedValue(value: string) {
    return value.split('').filter((c) => !isNaN(+c)).join('');
  }

  writeValue(input: string): void {
    if (input) { this.date = this.parseDateString(input, this.format); }
    else { this.date = undefined; }
    this.updateDisplayDate();
  }
  registerOnChange(fn) { this.onChange = fn; }
  registerOnTouched(fn) { this.onTouch = fn; }
  setDisabledState?(isDisabled: boolean) { this.disabled = isDisabled; }

  validate(control: AbstractControl) {
    if (control.untouched || !this.input.value) { return null; }
    const mom = this.getMoment();
    if (!control.value || !mom.isValid()) { return { invalidDateTime: true }; }
    if (this.maxDate && mom.valueOf() > this.maxDate.getTime()) { return { maxDate: true }; }
    if (this.minDate && mom.valueOf() < this.minDate.getTime()) { return { minDate: true }; }
    return null;
  }

  private getMoment(): Moment {
    const dateChunks = this.chunkDateString(this.input.value, this.displayFormat);
    return moment({ ...dateChunks, month: dateChunks.month - 1 }, true);
  }

  private updateDisplayDate() {
    console.log(this.date, this.displayFormat, this.language);
    const displayDate = this.date ? formatDate(this.date, this.displayFormat, this.language) : '';
    this.input.setValue(displayDate);
  }

  private createFormatMask(format: string): string {
    return format.replace(/[dMyHhmSs]/g, '0');
  }

  private inputMatchesFormat(input: string, format: string): boolean {
    const regex = new RegExp(format.replace(/[dMyHhmSs]/g, '\\d'));
    return regex.test(input);
  }

  ngOnDestroy(): void {
    if (this.localeChanged$) { this.localeChanged$.unsubscribe(); }
  }

}
