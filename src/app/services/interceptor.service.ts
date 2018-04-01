import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs/Observable';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class Interceptor implements HttpInterceptor {
    constructor(public authService: AuthService) { }
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
}
