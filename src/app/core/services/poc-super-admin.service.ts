import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {environment} from 'src/environments/environment';
import {IListResult} from '../models/interfaces/list-result.interface';
import {Filters, flattenFilters} from '../models/filters';
import {IPocSuperAdmin} from '../models/interfaces/poc-super-admin.interface';
import {ActivatedRoute} from "@angular/router";
import {ITenant} from "../models/interfaces/tenant.interface";
import {ITenantChanges} from "../models/interfaces/tenant-changes.interface";

@Injectable({
    providedIn: 'root',
})
export class PocSuperAdminService {
    superAdminPath = 'super-admin/';
    baseUrl = environment.pocManagerApi + this.superAdminPath;
    pocsUrl = `${this.baseUrl}pocs`;
    pocDetailsUrl = `${this.baseUrl}poc`;
    tenantsUrl = `${this.baseUrl}tenants`;
    tenantDetailsUrl = `${this.baseUrl}tenant`;
    appPocClientCertUpdateUrl = `${this.baseUrl}certificates/pocs/renew`;
    tenantCertUpdateUrl = `${this.baseUrl}certificates/tenants/renew`;

    constructor(
        private http: HttpClient,
        private route: ActivatedRoute) {
    }

    getPoc(id: string) {
        const url = `${this.pocDetailsUrl}/${id}`;
        return this.http.get<IPocSuperAdmin>(url);
    }

    getAllPocs(filters: Filters): Observable<IListResult<IPocSuperAdmin>> {
        return this.http.get<IListResult<IPocSuperAdmin>>(this.pocsUrl, {
            params: flattenFilters(filters) as any,
        });
    }

    renewAppPoCClientCert(pocId: string) {
        if (pocId) {
            const url = this.appPocClientCertUpdateUrl;
            const array = [pocId];
            return this.http.patch(url, {ids: array});
        }
        return of(Error());
    }

    renewTenantClientCert(tenantId: string, force: boolean = false) {
        if (tenantId) {
            const url = this.tenantCertUpdateUrl;
            const body = {ids: [tenantId]};
            if (force) {
                body['force'] = true;
            }
            return this.http.patch(url, body);
        }
        return of(Error());
    }

    getAllTenants(filters: Filters): Observable<IListResult<ITenant>> {
        return this.http.get<IListResult<ITenant>>(this.tenantsUrl, {
            params: flattenFilters(filters) as any,
        });
    }

    getTenant(id: string) {
        const url = `${this.tenantDetailsUrl}/${id}`;
        return this.http.get<ITenant>(url);
    }

    updateTenant(id: string, data: ITenantChanges) {
        const url = `${this.tenantDetailsUrl}/${id}`;
        return this.http.put<ITenantChanges>(url, data);
    }
}
