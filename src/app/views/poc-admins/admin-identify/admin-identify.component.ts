import { formatDate } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DateFormats } from 'src/app/core/models/enums/date-format.enum';
import { IPocAdmin } from 'src/app/core/models/interfaces/poc-admin.interface';
import { LocaleService } from 'src/app/core/services/locale.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { PocAdminService } from 'src/app/core/services/poc-admin.service';

type AdminIdentity = [IPocAdmin, string];

@Component({
  selector: 'app-admin-identify',
  templateUrl: './admin-identify.component.html',
  styleUrls: ['./admin-identify.component.scss'],
})
export class AdminIdentifyComponent implements OnInit, OnDestroy {
  form: FormGroup;
  data$: Observable<AdminIdentity>;

  private unsubscribe$ = new Subject();

  constructor(
    public adminService: PocAdminService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: NotificationService,
    private localeService: LocaleService,
  ) { }

  ngOnInit() {
    this.adminService.selectedAdmin$.pipe(
      tap(admin => {
        if (!admin) { this.router.navigate(['/views', 'poc-admins']); }
      }),
      switchMap(admin => {
        const initialId$ = admin.webIdentInitiateId ? of(admin.webIdentInitiateId) : this.adminService.getInitialIdentId(admin.id);
        return initialId$.pipe(map(initialId => [admin, initialId] as AdminIdentity));
      }),
      takeUntil(this.unsubscribe$),
      tap(data => this.generateForm(data)),
      catchError(() => of(null))
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  confirm() {
    if (this.form.valid) {
      const id = this.form.get('id').value;
      const initialId = this.form.get('initialId').value;
      const completedId = this.form.get('completedId').value;

      this.adminService.postWebIdentId({ pocAdminId: id, webIdentInitiateId: initialId, webIdentId: completedId }).pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe(() => {
        this.notification.success({ message: 'adminIdentify.success' });
        this.backToList();
      });
    }
  }

  generateForm(data: AdminIdentity) {
    const dob = this.localeService.toLocaleBirthDate(data[0].dateOfBirth);

    this.form = this.fb.group({
      id: [{ value: data[0].id, disabled: true }],
      firstName: [{ value: data[0].firstName, disabled: true }],
      lastName: [{ value: data[0].lastName, disabled: true }],
      dateOfBirth: [{ value: dob, disabled: true }],
      email: [{ value: data[0].email, disabled: true }],
      phone: [{ value: data[0].phone, disabled: true }],
      initialId: [{ value: data[1], disabled: true }],
      completedId: [{ value: '', disabled: false }, [Validators.required]],
    });
  }

  contentCopied(key: string) {
    const field = this.translate.instant(key);
    const message = this.translate.instant('adminIdentify.copyMessage', { field });
    this.notification.success({ message });
  }

  backToList() {
    this.router.navigate(['../..'], { relativeTo: this.route });
  }

}

