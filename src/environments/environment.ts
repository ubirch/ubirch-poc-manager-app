// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

const keycloakURL: any = {
    base: 'https://id.certify.dev.ubirch.com/auth',
    clone: 'https://id-clone.certify.dev.ubirch.com/auth'
};
const usedKeycloak: string = keycloakURL.clone;

const keycloakConfig: any = {
    url: usedKeycloak,
    realm: 'poc-certify',
    clientId: 'poc-manager-user-access-local'
};

export const environment = {
    production: false,
    keycloak: keycloakConfig,
    pocManagerApi: 'https://api.poc.dev.ubirch.com/',
    revocationApi: 'https://api.crl.dev.ubirch.com/',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
