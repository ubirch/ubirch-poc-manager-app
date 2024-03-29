import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NotificationService } from './notification.service';

@Injectable({
    providedIn: 'root',
})
export class ErrorHandlerService {
    constructor(private notification: NotificationService) {}

    handlerResponseError(error: HttpErrorResponse) {
        let notification;
        console.log(error);
        switch (error.status) {
            case 400:
                if (error.message.includes('too many records')) {
                    notification = this.notification.error({
                        message: 'revocationRequester.exportError',
                        title: 'revocationRequester.exportErrortitle',
                    });
                    break;
                } else if (error.error.errorMessage.includes('externalId') && error.error.errorMessage.includes('is already used')) {
                    notification = this.notification.error({
                        message: 'locationEdit.errors.duplicateMessage',
                        title: 'locationEdit.errors.duplicateTitle',
                    });
                    break;
                } else {
                    notification = this.notification.error({
                        message: 'global.errors.400',
                        title: 'global.errors.400Title',
                    });
                    break;
                }
            case 403:
                notification = this.notification.error({
                    message: 'global.errors.403',
                    title: 'global.errors.403Title',
                });
                break;
            case 409:
                if (error.url.includes('api.poc')) {
                    notification = this.notification.error({
                        message: 'global.errors.poc409',
                        title: 'global.errors.poc409Title',
                    });
                } else if (error.url.includes('api.crl')) {
                    notification = this.notification.error({
                        message: 'global.errors.revocation409',
                        title: 'global.errors.revocation409Title',
                    });
                }
                break;
            default:
                notification = this.notification.error({
                    message: 'global.errors.requestDefault',
                    title: 'global.errors.requestDefaultTitle',
                });
                break;
        }

        return notification;
    }
}
