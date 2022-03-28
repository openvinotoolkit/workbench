import { HttpContextToken } from '@angular/common/http';

export const IS_ERROR_NOTIFICATION_DISABLED = new HttpContextToken<boolean>(() => false);
