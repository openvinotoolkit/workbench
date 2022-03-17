import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { get } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import { loginAction } from '@store/auth-store/auth-store.actions';
import { selectError as selectAuthError } from '@store/auth-store/auth-store.selectors';
import { RootStoreState } from '@store/index';

import { AuthErrorDTO, JWTAuthStatusCodeEnum } from '@shared/models/jwt';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

@Component({
  selector: 'wb-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  public loginHint: string;
  public loginForm: FormGroup;
  public authErrorMessage$: Observable<string | null>;

  readonly tokenControlName = 'tokenControl';

  public tokenField: AdvancedConfigField = {
    type: 'password',
    label: 'Enter Login Token',
    name: this.tokenControlName,
  };

  constructor(
    private messagesService: MessagesService,
    private formBuilder: FormBuilder,
    private store$: Store<RootStoreState.State>
  ) {
    this.loginHint = this.messagesService.getHint('login', 'loginTip');
    this.loginForm = this.formBuilder.group({});
    this.authErrorMessage$ = this.store$.select(selectAuthError).pipe(
      filter(
        (error) =>
          get<AuthErrorDTO, 'error', 'authStatus'>(error, ['error', 'authStatus']) !== JWTAuthStatusCodeEnum.MISSING_JWT
      ),
      map((error) => {
        if (!error) {
          return null;
        }

        return error && error.message ? `${error.message}. Try again.` : 'Something went wrong. Please try again.';
      })
    );
    const tokenControl = this.formBuilder.control(null, Validators.required);
    this.loginForm.addControl(this.tokenControlName, tokenControl);
  }

  get loginToken() {
    return this.loginForm.get(this.tokenControlName).value;
  }

  login(token: string): void {
    this.store$.dispatch(loginAction({ token }));
  }
}
