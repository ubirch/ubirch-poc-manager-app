import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { TranslateService } from '@ngx-translate/core';
import { merge, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { PocActions } from 'src/app/core/models/enums/poc-actions.enum';
import { PocStatus } from 'src/app/core/models/enums/poc-status.enum';
import { Poc } from 'src/app/core/models/interfaces/poc.interface';
import { PocFilters } from 'src/app/core/models/poc-filters';
import { PocDataSource } from 'src/app/core/services/data-sources/poc-data-source';
import { PocsService } from 'src/app/core/services/pocs.service';
import { detailExpand } from 'src/app/core/utils/animations';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from 'src/app/core/utils/constants';
import { ConfirmDialogComponent, ConfirmDialogModel } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-poc-list',
  templateUrl: './poc-list.component.html',
  styleUrls: ['./poc-list.component.scss'],
  animations: [detailExpand],
})
export class PocListComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  dataSource: PocDataSource;
  displayColumns: string[] = [
    'select',
    'pocId',
    'name',
    // 'deviceId',
    'folderIdentifier',
    'createdAt',
    'updatedAt',
    'status',
  ];
  selection = new SelectionModel<Poc>(true, []);
  defaultPageSize = DEFAULT_PAGE_SIZE;
  pageSizes = PAGE_SIZES;
  expandedElement: Poc | null;

  filters: FormGroup;
  action: FormControl = new FormControl(PocActions.delete);
  actions = [
    { value: PocActions.delete, label: `pocList.actions.delete` }
  ];
  statuses: string[] = [PocStatus.ready, PocStatus.pending, PocStatus.processing];
  showActions = false;

  get search() { return this.filters.get('search'); }

  private unsubscribe$ = new Subject();

  constructor(
    private pocService: PocsService,
    private fb: FormBuilder,
    private translate: TranslateService,
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.dataSource = new PocDataSource(this.pocService);
    this.dataSource.loadPocs(new PocFilters());
    this.generateFilters();
  }

  ngAfterViewInit(): void {
    const search$ = this.search.valueChanges.pipe(
      filter(() => this.search.valid),
      distinctUntilChanged(),
      debounceTime(1000),
      map(search => ({ search })),
    );

    const filters$ = this.filters.get('filterColumns').valueChanges;

    const sort$ = this.sort.sortChange.pipe(
      map(sort => ({
        pageIndex: 0,
        sortColumn: sort.active,
        sortOrder: sort.direction,
      }))
    );

    const paginate$ = this.paginator.page.pipe(
      map(page => ({
        pageIndex: page.pageIndex,
        pageSize: page.pageSize
      }))
    );

    merge(search$, sort$, paginate$, filters$).pipe(
      tap(filters => {
        this.filters.patchValue(filters);
        this.loadPocPage();
      }),
      takeUntil(this.unsubscribe$),
    ).subscribe();

    this.selection.changed
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        v => this.showActions = this.selection.selected?.length > 0
      );
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource?.data?.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: Poc): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.pocId}`;
  }

  applyAction() {
    const selected = this.selection.selected;
    switch (this.action.value) {
      case PocActions.delete:
        this.deleteItems(selected);
        break;
      default:
        break;
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribe$) {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
  }

  private deleteItems(pocs: Poc[]) {
    const message = this.translate.instant('pocList.actions.deleteConfirmMessage', { count: this.selection.selected.length });
    const title = this.translate.instant('pocList.actions.deleteConfirmTitle');
    const dialogData = new ConfirmDialogModel(title, message);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '800px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.dataSource.deletePocs(pocs, this.filters.value);
        this.selection.clear();
      }
    });
  }

  private loadPocPage() {
    this.dataSource.loadPocs(this.filters.value);
  }

  private generateFilters() {
    this.filters = this.fb.group({ ...new PocFilters(), status: undefined });
    this.filters.get('search').setValidators([Validators.minLength(3)]);

    this.filters.addControl('filterColumns', this.fb.group({
      status: ['']
    }));
  }
}