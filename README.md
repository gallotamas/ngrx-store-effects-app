# Pizza app

This project was forked from [UltimateAngular/ngrx-store-effects-app](https://github.com/UltimateAngular/ngrx-store-effects-app). Your task is to add Falcon authentication to this project.

## 0. See the core-auth project
[FalconSocial/core-auth](https://github.com/FalconSocial/core-auth)

## 1. Add core-auth dependency
```sh
npm install @falconio/core-auth --save
```

## 2. Initiate authentication on application startup
Let's create an Angular service that can be used to initiate authentication and to access the authentication related data later on.

To authenticate with Falcon all you have to do is to call the `authenticateWithFalcon()` function with the proper configuration.

```ts
// auth.service.ts
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

    get instance(): FalconAuthInstance { return this._instance; }

    authenticate(): Promise<FalconAuthInstance> {
        return authenticateWithFalcon(authConfig).then((auth) => {
            this._instance = auth;
            return auth;
        });
    }
}
```

In Angular you can hook into the app initialization process by providing a function as an `APP_INITIALIZER`.

```ts
// app.module.ts
import { NgModule, APP_INITIALIZER } from '@angular/core';

function initApp(authService: AuthService) {
    return () => authService.authenticate();
}

@NgModule({
    // ...
    providers: [
        AuthService,
        { provide: APP_INITIALIZER, useFactory: initApp, deps: [AuthService], multi: true },
    ],
    // ...
})
export class AppModule {}
```
At this point you get redirected to the login page and you have to provide valid credentials to be able to access the application. However, for backend services the user is still not authenticated because the bearer token does not get sent back in xhr requests.

## 3. Create an interceptor
The easiest way to send the bearer token in every request is to create an http interceptor and add the Authorization header there.

```ts
// interceptor.service.ts
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class Interceptor implements HttpInterceptor {
    constructor(public authService: AuthService) { }
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        request = request.clone({
            setHeaders: {
                'Authorization': `Bearer ${this.authService.instance.token}`
            }
        });
        return next.handle(request);
    }
}
```

If you have a look at the network tab now you can see that the bearer token gets sent in every request.

There is one issue with the above implementation though. The token is only valid for a short time (5 minutes) and you have to renew it before it gets expired. So let's make sure that we update the token before it gets expired.

```ts
// interceptor.service.ts
// ...
import { fromPromise } from 'rxjs/observable/fromPromise';
import { switchMap } from 'rxjs/operators';

    // ...
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // update token if there is less then 10 seconds left before it expires.
        return fromPromise(this.authService.instance.updateToken(10))
            .pipe(
                switchMap(() => {
                    request = request.clone({
                        setHeaders: {
                            'Authorization': `Bearer ${this.authService.instance.token}`
                        }
                    });
                    return next.handle(request);
                })
            );
    }
```

## 4. Add a logout link
Let's add a logout link to the main navigation bar.

```ts
// app.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
@Component({
    // ...
    <a (click)="logout()" href="#">Logout</a>
    // ...
})
export class AppComponent {
    constructor(private authService: AuthService) {}

    logout() {
        this.authService.instance.logout();
    }
}
```
