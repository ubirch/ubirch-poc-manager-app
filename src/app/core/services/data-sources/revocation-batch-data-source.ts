import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { HttpErrorResponse } from '@angular/common/http';
import {
    BehaviorSubject,
    catchError,
    finalize,
    Observable,
    of,
    tap,
} from 'rxjs';

import { Filters } from '../../models/filters';
import { IListResult } from '../../models/interfaces/list-result.interface';
import { RevocationBatch } from '../../models/interfaces/revocation-batch.interface';
import { ErrorHandlerService } from '../error-handler.service';
import { RevocationService } from '../revocation.service';

export class RevocationBatchDataSource implements DataSource<RevocationBatch> {
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private totalItemsSubject = new BehaviorSubject<number>(0);
    private batchesSubject = new BehaviorSubject<RevocationBatch[]>([]);

    public loading$ = this.loadingSubject.asObservable();
    public totalItems$ = this.totalItemsSubject.asObservable();

    get data() {
        return this.batchesSubject.value;
    }

    constructor(
        private service: RevocationService,
        private error: ErrorHandlerService
    ) {}

    connect(
        collectionViewer: CollectionViewer
    ): Observable<RevocationBatch[] | readonly RevocationBatch[]> {
        return this.batchesSubject.asObservable();
    }
    disconnect(collectionViewer: CollectionViewer): void {
        this.batchesSubject.complete();
        this.loadingSubject.complete();
    }

    loadBatches(filters: Filters) {
        this.loadingSubject.next(true);

        this.service
            .getBatches(filters)
            .pipe(finalize(() => this.loadingSubject.next(false)))
            .subscribe({
                next: (batchesResult) => {
                    this.batchesSubject.next(batchesResult.records ?? []);
                    this.totalItemsSubject.next(batchesResult.total ?? 0);
                },
                error: (err: HttpErrorResponse) => {
                    this.error.handlerResponseError(err);
                    return of({} as IListResult<RevocationBatch>);
                },
            });
    }

    deleteBatch(revocationBatch: RevocationBatch, filters: Filters) {
        this.loadingSubject.next(true);
        this.service
            .deleteRevocationBatch(revocationBatch)
            .pipe(
                tap(() => this.loadBatches({ ...filters, pageIndex: 0 })),
                catchError((err) => of(this.error.handlerResponseError(err))),
                finalize(() => this.loadingSubject.next(false))
            )
            .subscribe();
    }
}
