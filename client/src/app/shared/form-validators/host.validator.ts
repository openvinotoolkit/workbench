import { AbstractControl, ValidationErrors } from '@angular/forms';

const ipAddressRegexp = /^\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b$/;

const hostNameRegexp = /^([-a-zA-Z0-9]{1,256}|(https?:\/\/)?(www\.)?([-a-zA-Z0-9@:%_.\+~#=]{1,256}\.[a-zA-Z0-9]{1,6}))$/;

export function hostValidator({ value }: AbstractControl): ValidationErrors | null {
  if (!value) {
    return { required: true };
  }
  const isIpAddressPattern = value.split('.').every((ipSegment: string) => isFinite(Number(ipSegment)));
  if (isIpAddressPattern) {
    return ipAddressRegexp.test(value) ? null : { invalidIpAddress: true };
  } else {
    return hostNameRegexp.test(value) ? null : { invalidHostName: true };
  }
}
