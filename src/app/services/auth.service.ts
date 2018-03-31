import { Injectable } from '@angular/core';
import { authenticateWithFalcon, AuthConfiguration, FalconAuthInstance } from '@falconio/core-auth';

const authConfig: AuthConfiguration = {
    authServerBaseUrl: 'https://accounts-staging.falcon.io',
    clientId: 'falcon',
    createLegacyFalconSession: true
};

@Injectable()
export class AuthService {
    private _instance: FalconAuthInstance;

    get instance() { return this._instance; }

    authenticate() {
        return authenticateWithFalcon(authConfig).then((auth) => {
            console.log(auth);
            this._instance = auth;
        });
    }
}
