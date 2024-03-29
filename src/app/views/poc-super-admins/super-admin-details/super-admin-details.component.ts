import { Component, OnInit } from '@angular/core';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { PocSuperAdminService } from 'src/app/core/services/poc-super-admin.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ILocale } from '../../../core/models/interfaces/locale.interface';
import { LocaleService } from '../../../core/services/locale.service';
import { CERTURGENCY } from '../../../core/models/enums/certUrgency.enum';
import { interval, startWith, Subscription } from 'rxjs';
import { getCertUrgency, getFormatedDateTime } from '../../../core/utils/date';

@Component({
    selector: 'app-super-admin-details',
    templateUrl: './super-admin-details.component.html',
    styleUrls: ['./super-admin-details.component.scss'],
})
export class SuperAdminDetailsComponent implements OnInit {
    form: UntypedFormGroup;
    poc: any;
    pocId: string;
    locale: ILocale;

    polling: Subscription;
    isPolling = false;
    CERTURGENCY = CERTURGENCY;

    constructor(
        private pocSuperAdminService: PocSuperAdminService,
        private errorService: ErrorHandlerService,
        private route: ActivatedRoute,
        private fb: UntypedFormBuilder,
        private router: Router,
        private confirmDialog: ConfirmDialogService,
        private translate: TranslateService,
        private notificationService: NotificationService,
        private localService: LocaleService
    ) {}

    ngOnInit() {
        this.localService.current$.subscribe(
            (locale) => (this.locale = locale)
        );
        this.route.paramMap
            .pipe(
                map((params: ParamMap) => params.get('id')),
                filter((pocId) => !!pocId),
                tap((pocId) => (this.pocId = pocId)),
                switchMap((pocId) => this.pocSuperAdminService.getPoc(pocId))
            )
            .subscribe({
                next: (res: any) => {
                    this.poc = res;
                    //                    console.log(this.poc);
                    this.generateForm();
                },
                error: (err) => {
                    this.errorService.handlerResponseError(err);
                    this.router.navigate(['../../'], {
                        relativeTo: this.route,
                    });
                },
            });
    }

    generateForm() {
        this.form = this.fb.group({
            tenant: [{ value: this.poc.tenantName, disabled: true }],
            pocDetails: this.fb.group({
                pocName: [
                    { value: this.poc.pocName, disabled: true },
                    [Validators.required, Validators.minLength(3)],
                ],
                externalId: [
                    { value: this.poc.externalId, disabled: true },
                    [Validators.required],
                ],
                status: [
                    { value: this.poc.status.toLowerCase(), disabled: true },
                ],
                createdAt: [
                    {
                        value: getFormatedDateTime(
                            this.poc.created,
                            this.locale
                        ),
                        disabled: true,
                    },
                    [Validators.required, Validators.minLength(5)],
                ],
                active: [
                    { value: this.poc.active, disabled: true },
                    [Validators.required, Validators.minLength(3)],
                ],
            }),
            clientCert: [
                { value: this.poc.phone, disabled: true },
                [Validators.required],
            ],
        });
    }

    renewClientCertificate() {
        this.confirmDialog
            .open({
                title: this.translate.instant('superAdmin.cert.renew-title'),
                message: this.translate.instant(
                    'superAdmin.cert.renew-message'
                ),
                yes: this.translate.instant('superAdmin.cert.renew-yes'),
                no: this.translate.instant('superAdmin.cert.renew-no'),
                okOnly: false,
            })
            .subscribe((result) => {
                if (result) {
                    this.restartPolling(this.pocId);
                    this.pocSuperAdminService
                        .renewAppPoCClientCert(this.poc.id)
                        .subscribe({
                            next: (res: any) => {
                                this.notificationService.success({
                                    message: this.translate.instant(
                                        'superAdmin.cert.renew-success'
                                    ),
                                    title: this.translate.instant(
                                        'superAdmin.cert.renew-success-title'
                                    ),
                                });
                            },
                            error: (err) => {
                                this.errorService.handlerResponseError(err);
                            },
                        });
                }
            });
    }

    checkCertUrgency() {
        return getCertUrgency(this.poc.mainAdmin.certExpirationDate);
    }

    public restartPolling(pocId: string) {
        this.stopPolling();

        this.polling = interval(10000)
            .pipe(
                startWith(0),
                switchMap(() => this.pocSuperAdminService.getPoc(pocId))
            )
            .subscribe({
                next: (res: any) => {
                    this.isPolling = true;
                    console.log('polling');
                    let oldCert = this.poc.mainAdmin.certExpirationDate;
                    this.poc = res;
                    this.generateForm();
                    if (oldCert !== this.poc.mainAdmin.certExpirationDate) {
                        this.stopPolling();
                        this.isPolling = false;
                    }
                },
                error: (err) => {
                    this.errorService.handlerResponseError(err);
                    this.router.navigate(['../../'], {
                        relativeTo: this.route,
                    });
                },
            });
    }

    public stopPolling() {
        if (this.polling) {
            this.polling.unsubscribe();
        }
    }

    ngOnDestroy() {
        this.stopPolling();
    }
}
