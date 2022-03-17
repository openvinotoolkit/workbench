export enum JWTAuthStatusCodeEnum {
  MISSING_JWT = 4011,
  INVALID_JWT = 4012,
  EXPIRED_ACCESS_JWT = 4013,
  EXPIRED_REFRESH_JWT = 4014,
}

// TODO utilize single error type
export interface AuthErrorDTO {
  message: string;
  error?: {
    authStatus: JWTAuthStatusCodeEnum;
    message: string;
  };
}
