import { Validators } from '@angular/forms';

import { Dictionary } from '@ngrx/entity';

import { hostValidator } from '@shared/form-validators/host.validator';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

export enum TargetMachineFormControlNames {
  HOST = 'host',
  PORT = 'port',
  NAME = 'name',
  USERNAME = 'username',
  PRIVATE_KEY = 'privateKey',
}

export enum ProxyUtilsControlNames {
  USE_PROXY = 'useProxy',
  USE_HTTP_PROXY = 'httpProxy',
  USE_HTTPS_PROXY = 'httpsProxy',
  HTTP_PROXY_PASSWORD_REQUIRED = 'httpProxyPasswordRequired',
  HTTPS_PROXY_PASSWORD_REQUIRED = 'httpsProxyPasswordRequired',
}

export enum ProxyControlNames {
  HOST = 'host',
  PORT = 'port',
  USERNAME = 'username',
  PASSWORD = 'password',
}

export const requiredTargetMachineFields: AdvancedConfigField[] = [
  {
    name: TargetMachineFormControlNames.HOST,
    label: 'Hostname',
    type: 'text',
    validators: [Validators.required, hostValidator],
    tooltip: {
      prefix: 'targetMachineForm',
      value: 'hostname',
    },
  },
  {
    name: TargetMachineFormControlNames.PORT,
    label: 'Port',
    value: 22,
    type: 'input',
    validators: [Validators.required, Validators.min(0)],
    numberType: 'integer',
    tooltip: {
      prefix: 'targetMachineForm',
      value: 'port',
    },
  },
  {
    name: TargetMachineFormControlNames.NAME,
    label: 'Target Name',
    type: 'text',
    validators: [Validators.required],
    tooltip: {
      prefix: 'targetMachineForm',
      value: 'name',
    },
  },
  {
    name: TargetMachineFormControlNames.USERNAME,
    label: 'User',
    type: 'text',
    validators: [Validators.required],
    tooltip: {
      prefix: 'targetMachineForm',
      value: 'username',
    },
  },
];

export const proxyUtilsFieldsMap: Dictionary<AdvancedConfigField> = {
  [ProxyUtilsControlNames.USE_PROXY]: {
    name: ProxyUtilsControlNames.USE_PROXY,
    label: 'Use Proxy',
    type: 'checkbox',
    tooltip: {
      prefix: 'targetMachineForm',
      value: 'useProxy',
    },
  },
  [ProxyUtilsControlNames.USE_HTTP_PROXY]: {
    name: ProxyUtilsControlNames.USE_HTTP_PROXY,
    label: 'HTTP Proxy',
    type: 'checkbox',
    tooltip: {
      prefix: 'targetMachineForm',
      value: 'httpProxy',
    },
  },
  [ProxyUtilsControlNames.USE_HTTPS_PROXY]: {
    name: ProxyUtilsControlNames.USE_HTTPS_PROXY,
    label: 'HTTPS Proxy',
    type: 'checkbox',
    tooltip: {
      prefix: 'targetMachineForm',
      value: 'httpsProxy',
    },
  },
  [ProxyUtilsControlNames.HTTP_PROXY_PASSWORD_REQUIRED]: {
    name: ProxyUtilsControlNames.HTTP_PROXY_PASSWORD_REQUIRED,
    label: 'Proxy-server requires password',
    type: 'checkbox',
    tooltip: {
      prefix: 'targetMachineForm',
      value: 'passwordRequired',
    },
  },
  [ProxyUtilsControlNames.HTTPS_PROXY_PASSWORD_REQUIRED]: {
    name: ProxyUtilsControlNames.HTTPS_PROXY_PASSWORD_REQUIRED,
    label: 'Proxy-server requires password',
    type: 'checkbox',
    tooltip: {
      prefix: 'targetMachineForm',
      value: 'passwordRequired',
    },
  },
};

export const proxyFieldsMap: Dictionary<AdvancedConfigField> = {
  [ProxyControlNames.HOST]: {
    name: ProxyControlNames.HOST,
    label: 'Hostname',
    type: 'text',
    validators: [Validators.required, hostValidator],
    tooltip: {
      prefix: 'targetMachineForm',
      value: 'proxyHostname',
    },
  },
  [ProxyControlNames.PORT]: {
    name: ProxyControlNames.PORT,
    label: 'Port',
    type: 'input',
    validators: [Validators.required, Validators.min(0)],
    numberType: 'integer',
    tooltip: {
      prefix: 'targetMachineForm',
      value: 'proxyPort',
    },
  },
  [ProxyControlNames.USERNAME]: {
    name: ProxyControlNames.USERNAME,
    label: 'Username',
    type: 'text',
    validators: [Validators.required],
    tooltip: {
      prefix: 'targetMachineForm',
      value: 'proxyUsername',
    },
  },
  [ProxyControlNames.PASSWORD]: {
    name: ProxyControlNames.PASSWORD,
    label: 'Password',
    type: 'password',
    tooltip: {
      prefix: 'targetMachineForm',
      value: 'proxyPassword',
    },
  },
};
