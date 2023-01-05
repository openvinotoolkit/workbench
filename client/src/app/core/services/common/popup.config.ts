import { MatLegacySnackBarConfig as MatSnackBarConfig } from '@angular/material/legacy-snack-bar';

export enum SnackBarTypes {
  ERROR_SNACK_BAR = 'ERROR_SNACK_BAR',
  COOKIE_SNACK_BAR = 'COOKIE_SNACK_BAR',
}

export type SnackBarTypesT = SnackBarTypes.COOKIE_SNACK_BAR | SnackBarTypes.ERROR_SNACK_BAR;

export const BackendErrorConfig = {
  verticalPosition: 'bottom',
  horizontalPosition: 'center',
  panelClass: ['wb-snack-bar-container', 'popup-container', 'popup-container-red'],
  data: {},
  duration: 5000,
} as MatSnackBarConfig;

export const CookieBannerConfig = {
  verticalPosition: 'bottom',
  horizontalPosition: 'left',
  panelClass: ['wb-snack-bar-container', 'popup-container', 'popup-container-red'],
  data: {},
  duration: undefined,
} as MatSnackBarConfig;
