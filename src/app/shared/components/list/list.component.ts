import { SelectionModel } from '@angular/cdk/collections';
import { Directive, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { ListAction } from 'src/app/core/models/enums/list-actions.enum';
import { IAction } from 'src/app/core/models/interfaces/action.interface';
import { IListDataSource } from 'src/app/core/services/data-sources/poc-admin-data-source';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';

@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class ListComponent<T> implements OnDestroy {
  selection = new SelectionModel<T>(true, []);
  dataSource: IListDataSource<T>;

  action: UntypedFormControl;
  actions: IAction<T>[];
  showActions = false;

  protected unsubscribe$ = new Subject<void>();

  get selectedCount() { return this.selection?.selected?.length; }

  constructor(
    protected fb: UntypedFormBuilder,
    protected errorService: ErrorHandlerService,
    protected notificationService: NotificationService,
    protected router: Router,
    protected confirmService: ConfirmDialogService,
    protected translateService: TranslateService,
  ) { }

  protected abstract loadItemsPage();

  ngOnDestroy(): void {
    if (this.unsubscribe$) {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
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
  checkboxLabel(row?: T): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`;
  }

  protected clearSelection() {
    if (this.selection?.hasValue()) { this.selection.clear(); }
  }

  protected handleActionResponse({ ok, nok }, action: ListAction, prefix: string) {
    if (nok?.length > 0) {
      if (ok?.length === 0) {
        this.notificationService.error({
          message: `${prefix}.actionMessages.${action}Error`,
          title: `${prefix}.actionMessages.${action}ErrorTitle`,
          duration: 7000
        });
      } else {
        this.notificationService.warning({
          message: this.translateService.instant(`${prefix}.actionMessages.${action}Warning`, { count: nok.length }),
          title: `${prefix}.actionMessages.${action}WarningTitle`,
          duration: 7000
        });
        this.clearSelection();
        this.loadItemsPage();
      }
    } else {
      this.notificationService.success({
        message: this.translateService.instant(`${prefix}.actionMessages.${action}Success`, { count: nok.length }),
        title: `${prefix}.actionMessages.${action}SuccessTitle`,
        duration: 7000
      });
      this.loadItemsPage();
      this.clearSelection();
    }
  }

  getActions(): IAction<T>[] {
    const actions = this.actions
      .filter(a => this.selection.selected.some((item: T) => a.predicate?.(item)));

    const action = actions.find(a => a.value === this.action?.value);
    if (!action) { this.action.setValue(actions?.[0]?.value); }

    return actions;
  }

}
