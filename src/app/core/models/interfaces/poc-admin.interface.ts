import { AdminStatus } from '../enums/admin-status.enum';
import { IBirthDate } from './birth-date.interface';

export interface IPocAdmin {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: IBirthDate;
    email: string;
    phone: string;
    pocName: string;
    pocId?: string;
    state: AdminStatus;
    active: boolean;
    createdAt: Date;
    webIdentRequired: boolean;
    webIdentInitiateId?: string;
    webIdentSuccessId?: string;
    isMainAdmin: boolean;
}
