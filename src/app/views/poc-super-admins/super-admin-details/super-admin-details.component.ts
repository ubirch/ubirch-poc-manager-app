import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {filter, map, switchMap, tap} from 'rxjs/operators';
import {ErrorHandlerService} from 'src/app/core/services/error-handler.service';
import {NotificationService} from 'src/app/core/services/notification.service';
import {ILocationIdChange} from '../../../core/models/interfaces/locationIdChange.interface';
import {LocationIdChangesStates} from '../../../core/models/enums/location-id-changes-states.enum';
import {IPocSuperAdmin} from 'src/app/core/models/interfaces/poc-super-admin.interface';
import {PocSuperAdminService} from 'src/app/core/services/poc-super-admin.service';
import {ConfirmDialogService} from "../../../shared/components/confirm-dialog/confirm-dialog.service";
import {IPoc} from "../../../core/models/interfaces/poc.interface";
import {ILocale} from "../../../core/models/interfaces/locale.interface";
import {LocaleService} from "../../../core/services/locale.service";
import {CERTURGENCY} from "../../../core/models/enums/certUrgency.enum";
import {Observable, Subscription} from "rxjs";

@Component({
    selector: 'app-super-admin-details',
    templateUrl: './super-admin-details.component.html',
    styleUrls: ['./super-admin-details.component.scss'],
})
export class SuperAdminDetailsComponent implements OnInit {
    form: FormGroup;
    poc: IPoc;
    pocId: string;
    locale: ILocale;
    expectedCertExpirationDate: Date;

    pocSubscription: Subscription;

    constructor(
        private pocSuperAdminService: PocSuperAdminService,
        private errorService: ErrorHandlerService,
        private route: ActivatedRoute,
        private fb: FormBuilder,
        private router: Router,
        private confirmDialog: ConfirmDialogService,
        private translate: TranslateService,
        private notificationService: NotificationService,
        private localService: LocaleService,
    ) {
    }


    ngOnInit() {
        this.localService.current$.subscribe(locale => this.locale = locale);
        this.pocSubscription = this.subscribeToPoc();
    }

    generateForm() {
        this.form = this.fb.group({
            tenant: this.fb.control(this.poc.tenantName),
            pocDetails: this.fb.group({
                pocName: this.fb
                    .control(this.poc.pocName, [
                        Validators.required,
                        Validators.minLength(3),
                    ]),
                externalId: this.fb
                    .control(this.poc.externalId, [Validators.required]),
                status: this.fb
                    .control(this.poc.status.toLowerCase()),
                createdAt: this.fb
                    .control(this.poc.created, [
                        Validators.required,
                        Validators.minLength(5),
                    ]),
                active: this.fb
                    .control(this.poc.active, [
                        Validators.required,
                        Validators.minLength(3),
                    ]),
            }),
            clientCert: this.fb
                .control(this.poc.phone, [Validators.required]),
        });
    }

    renewClientCertificate() {
        this.confirmDialog.open({
            title: this.translate.instant('superAdmin.cert.renew-title'),
            message: this.translate.instant('superAdmin.cert.renew-message'),
            yes: this.translate.instant('superAdmin.cert.renew-yes'),
            no: this.translate.instant('superAdmin.cert.renew-no'),
            okOnly: false
        }).subscribe((result) => {
            if (result) {
                this.pocSuperAdminService.renewClientCert(this.poc.id).subscribe({
                    next: (res: any) => {
                        this.notificationService.success({
                            message: this.translate.instant('superAdmin.cert.renew-success'),
                            title: this.translate.instant('superAdmin.cert.renew-success-title'),
                        });
                        this.expectedCertExpirationDate = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);
                    },
                    error: (err) => {
                        this.errorService.handlerResponseError(err);
                    },
                });
            }
        });
    }

    getCertUrgency() {
        let urgentThreshold = 28;
        let veryUrgentThreshold = 7;
        let expiredThreshold = 0;

        let expirationDate = new Date(this.poc.mainAdmin.certExpirationDate);
        let today = new Date();

        let timeDiff = expirationDate.getTime() - today.getTime();

        let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (diffDays <= expiredThreshold) {
            return CERTURGENCY.EXPIRED;
        }

        if (diffDays <= veryUrgentThreshold) {
            return CERTURGENCY.VERYURGENT;
        }

        if (diffDays <= urgentThreshold) {
            return CERTURGENCY.URGENT;
        }

        return CERTURGENCY.NONE;
    }

    subscribeToPoc() {
        return this.route.paramMap
            .pipe(
                map((params: ParamMap) => params.get('id')),
                filter((pocId) => !!pocId),
                tap((pocId) => (this.pocId = pocId)),
                switchMap((pocId) => this.pocSuperAdminService.getPoc(pocId))
            )
            .subscribe({
                next: (res: any) => {
                    this.poc = res;
                    console.log(this.poc);
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
}