import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, Observable, Subject, tap, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { FbAuthResponse, User } from "../../../shared/interfaces";

@Injectable({providedIn: 'root'})
export class AuthService {

    public error$: Subject<string> = new Subject<string>()
    constructor(private http: HttpClient) {}

    get token(): string | null{
        const expDate = new Date (localStorage.getItem('fb-token-exp')!)
        if(new Date() > expDate) {
            this.logout()
            return null
        }

        return localStorage.getItem('fb-token')
    }

    login(user: User): Observable<any> {
        user.returnSecureToken = true
        return this.http.post<FbAuthResponse>(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.apiKey}`, user)
        .pipe(
            tap(this.setToken),
            catchError(this.handelError.bind(this))
        )
    }
    logout() {
        this.setToken(null)
    }   

    isAuthenticated(): boolean {
        return !!this.token
    }

    private handelError(error: HttpErrorResponse) {
        const {message} = error.error.error

        switch (message) {
            case 'USER_DISABLED':
                this.error$.next('Неверный email')
                break
            case 'INVALID_PASSWORD':
                this.error$.next('Неверный пароль')
                break
            case 'EMAIL_NOT_FOUND':
                this.error$.next('Несуществующий email')
                break
        }

        return throwError(error)
    }

    private setToken(response: FbAuthResponse | null) {
        if(response) {
            const expDate = new Date(new Date().getTime() + +response.expiresIn * 1000)
            localStorage.setItem('fb-token', response.idToken)
            localStorage.setItem('fb-token-exp', expDate.toString())
        } else {
            localStorage.clear()
        }
        
    }
}