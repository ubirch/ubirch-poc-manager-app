import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NEVER, Observable, Subject, tap } from 'rxjs';
import { catchError, filter, map, takeUntil } from 'rxjs/operators';
import { ErrorBase } from 'src/app/core/models/interfaces/error.interface';
import { IPocAdmin } from 'src/app/core/models/interfaces/poc-admin.interface';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { LocaleService } from 'src/app/core/services/locale.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { PocAdminService } from 'src/app/core/services/poc-admin.service';

@Component({
    selector: 'app-admin-create',
    templateUrl: './admin-create.component.html',
    styleUrls: [ './admin-create.component.scss' ],
})
export class AdminCreateComponent implements OnInit, OnDestroy {

    public pocId$: Observable<string>;
    public pocId: string;
    private unsubscribe$ = new Subject<void>();

    constructor(
        private pocAdminService: PocAdminService,
        private errorService: ErrorHandlerService,
        private route: ActivatedRoute,
        private notificationService: NotificationService,
        private router: Router,
        private translateService: TranslateService,
        public localeService: LocaleService,
    ) {
    }

    ngOnInit() {
        this.pocId$ = this.route.paramMap.pipe(
            map((params: ParamMap) => params.get('pocId')),
            filter(pocId => !!pocId),
            tap(pocId => this.pocId = pocId),
            takeUntil(this.unsubscribe$),
            catchError((err) => {
                if (err instanceof ErrorBase) {
                    this.notificationService.error({ message: err.message, title: err.title });
                } else {
                    this.errorService.handlerResponseError(err);
                }
                this.router.navigate([ '../../' ], { relativeTo: this.route });
                return NEVER;
            }));
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    createAdmin(admin: IPocAdmin) {
        const successMsg = 'adminCreate.notifications.success';
        const successTitleMsg = 'adminCreate.notifications.successTitle';

        this.pocAdminService.postPocAdmin(admin).subscribe({
            next: (_) => {
                this.notificationService.success({
                    message: this.translateService.instant(successMsg),
                    title: this.translateService.instant(successTitleMsg),
                });
                this.router.navigate([ '/views', 'pocs', 'edit', this.pocId ]);
            },
            error: (err) => this.errorService.handlerResponseError(err),
        });
    }

}
