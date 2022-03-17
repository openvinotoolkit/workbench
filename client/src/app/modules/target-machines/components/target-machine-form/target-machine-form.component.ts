import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { cloneDeep, isEmpty, isEqual, values } from 'lodash';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';

import { TargetMachineItem, TargetMachineStatusNames } from '@shared/models/pipelines/target-machines/target-machine';
import { FormUtils } from '@shared/utils/form-utils';
import { FileUploadFieldComponent } from '@shared/components/file-upload-field/file-upload-field.component';
import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

import {
  ProxyControlNames,
  proxyFieldsMap,
  ProxyUtilsControlNames,
  proxyUtilsFieldsMap,
  requiredTargetMachineFields,
  TargetMachineFormControlNames,
} from './target-machine-form-fields';

@Component({
  selector: 'wb-target-machine-form',
  templateUrl: './target-machine-form.component.html',
  styleUrls: ['./target-machine-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetMachineFormComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input()
  editingTargetMachine: TargetMachineItem = null;

  @Output()
  save: EventEmitter<TargetMachineItem> = new EventEmitter<TargetMachineItem>();

  @Output()
  cancel: EventEmitter<void> = new EventEmitter();

  public readonly remoteProfileTip = this.messagesService.getHint('targetMachines', 'configureTargetMachineTips');

  // Fields
  public requiredTargetMachineFields = [...requiredTargetMachineFields];
  public proxyFieldsMap = cloneDeep(proxyFieldsMap);
  public proxyUtilsFieldsMap = cloneDeep(proxyUtilsFieldsMap);
  public readonly sshFileField = {
    name: TargetMachineFormControlNames.PRIVATE_KEY,
    label: 'SSH Key',
    maxFileSize: 1,
    tooltip: {
      prefix: 'targetMachineForm',
      value: TargetMachineFormControlNames.PRIVATE_KEY,
    },
  };
  private privateKeyFileName: string;

  @ViewChild('privateKeyFileUploadField')
  public privateKeyFileComponent: FileUploadFieldComponent;
  public privateKeyFileComponent$ = new Subject<FileUploadFieldComponent>();

  // Form Groups
  public targetMachineForm: FormGroup = this.fb.group({});
  public proxyUtilsFormGroup = this.fb.group({});
  public httpProxyForm: FormGroup = this.fb.group({});
  public httpsProxyForm: FormGroup = this.fb.group({});

  public feedbackDescription = this.messagesService.hintMessages.feedback.remoteTargetTipFeedback;

  private readonly defaultPort = 22;
  private unsubscribe$ = new Subject<void>();

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef, private messagesService: MessagesService) {
    // Add not optional controls to main form
    FormUtils.addControlsToForm(this.requiredTargetMachineFields, this.targetMachineForm);
    // Set default port
    this.targetMachineForm.get(TargetMachineFormControlNames.PORT).setValue(this.defaultPort);
    this.targetMachineForm.addControl(this.sshFileField.name, this.fb.control(null, Validators.required));

    // Add all utility controls
    FormUtils.addControlsToForm(values(proxyUtilsFieldsMap), this.proxyUtilsFormGroup);

    this.useProxyControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((useProxy: boolean) => {
      if (!useProxy) {
        this.useHttpProxyControl.setValue(false);
        this.useHttpsProxyControl.setValue(false);
      }
    });

    this.useHttpProxyControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((useHttpProxy: boolean) => {
      if (useHttpProxy) {
        this.targetMachineForm.addControl('httpProxy', this.httpProxyForm);
        FormUtils.addControlsToForm(this.proxyCommonFields, this.httpProxyForm);
      } else {
        this.targetMachineForm.removeControl('httpProxy');
        FormUtils.removeControlsFromForm(this.proxyCommonFields, this.httpProxyForm);
        this.useHttpProxyCredentialsControl.setValue(false);
      }
    });

    this.useHttpsProxyControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((useHttpsProxy: boolean) => {
      if (useHttpsProxy) {
        this.targetMachineForm.addControl('httpsProxy', this.httpsProxyForm);
        FormUtils.addControlsToForm(this.proxyCommonFields, this.httpsProxyForm);
      } else {
        this.targetMachineForm.removeControl('httpsProxy');
        FormUtils.removeControlsFromForm(this.proxyCommonFields, this.httpsProxyForm);
        this.useHttpsProxyCredentialsControl.setValue(false);
      }
    });

    this.useHttpProxyCredentialsControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((useHttpProxyCredentials: boolean) => {
        if (useHttpProxyCredentials) {
          FormUtils.addControlsToForm(this.proxyCredentialsFields, this.httpProxyForm);
        } else {
          FormUtils.removeControlsFromForm(this.proxyCredentialsFields, this.httpProxyForm);
        }
      });

    this.useHttpsProxyCredentialsControl.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((useHttpsProxyCredentials: boolean) => {
        if (useHttpsProxyCredentials) {
          FormUtils.addControlsToForm(this.proxyCredentialsFields, this.httpsProxyForm);
        } else {
          FormUtils.removeControlsFromForm(this.proxyCredentialsFields, this.httpsProxyForm);
        }
      });
  }

  get isEditMode(): boolean {
    return !!this.editingTargetMachine;
  }

  get isMachineConfigured(): boolean {
    return this.editingTargetMachine.lastConnectionStatus !== TargetMachineStatusNames.NOT_CONFIGURED;
  }

  get useProxyControl(): AbstractControl {
    return this.proxyUtilsFormGroup.get(ProxyUtilsControlNames.USE_PROXY);
  }

  get useProxyField(): AdvancedConfigField {
    return this.proxyUtilsFieldsMap[ProxyUtilsControlNames.USE_PROXY];
  }

  get useHttpProxyControl(): AbstractControl {
    return this.proxyUtilsFormGroup.get(ProxyUtilsControlNames.USE_HTTP_PROXY);
  }

  get useHttpProxyField(): AdvancedConfigField {
    return this.proxyUtilsFieldsMap[ProxyUtilsControlNames.USE_HTTP_PROXY];
  }

  get useHttpsProxyControl(): AbstractControl {
    return this.proxyUtilsFormGroup.get(ProxyUtilsControlNames.USE_HTTPS_PROXY);
  }

  get useHttpsProxyField(): AdvancedConfigField {
    return this.proxyUtilsFieldsMap[ProxyUtilsControlNames.USE_HTTPS_PROXY];
  }

  get useHttpProxyCredentialsControl(): AbstractControl {
    return this.proxyUtilsFormGroup.get(ProxyUtilsControlNames.HTTP_PROXY_PASSWORD_REQUIRED);
  }

  get useHttpProxyCredentialsField(): AdvancedConfigField {
    return this.proxyUtilsFieldsMap[ProxyUtilsControlNames.HTTP_PROXY_PASSWORD_REQUIRED];
  }

  get useHttpsProxyCredentialsControl(): AbstractControl {
    return this.proxyUtilsFormGroup.get(ProxyUtilsControlNames.HTTPS_PROXY_PASSWORD_REQUIRED);
  }

  get useHttpsProxyCredentialsField(): AdvancedConfigField {
    return this.proxyUtilsFieldsMap[ProxyUtilsControlNames.HTTPS_PROXY_PASSWORD_REQUIRED];
  }

  get proxyCommonFields(): AdvancedConfigField[] {
    return [this.proxyFieldsMap[ProxyControlNames.HOST], this.proxyFieldsMap[ProxyControlNames.PORT]];
  }

  get proxyCredentialsFields(): AdvancedConfigField[] {
    return [this.proxyFieldsMap[ProxyControlNames.USERNAME], this.proxyFieldsMap[ProxyControlNames.PASSWORD]];
  }

  get sshPrivateKeyControl(): AbstractControl {
    return this.targetMachineForm.get(TargetMachineFormControlNames.PRIVATE_KEY);
  }

  async handleSelectSSHPrivateKeyFile(file: File) {
    const fileContent = await FormUtils.getFileTextContentPromise(file);
    this.sshPrivateKeyControl.setValue(fileContent);
    this.privateKeyFileName = file.name;
    this.cdr.markForCheck();
  }

  saveTargetMachine(): void {
    const targetMachineFormValue: TargetMachineItem = this.targetMachineForm.getRawValue();
    targetMachineFormValue.privateKeyFileName = this.privateKeyFileName;
    if (this.isEditMode) {
      targetMachineFormValue.targetId = this.editingTargetMachine.targetId;
    }
    this.save.emit(targetMachineFormValue);
  }

  ngOnChanges(changes: SimpleChanges) {
    const { editingTargetMachine } = changes;
    if (
      !(editingTargetMachine && editingTargetMachine.currentValue) ||
      isEqual(editingTargetMachine.currentValue, editingTargetMachine.previousValue)
    ) {
      return;
    }
    this.populateTargetMachineForm(editingTargetMachine.currentValue);
  }

  private populateTargetMachineForm(targetMachine: TargetMachineItem): void {
    const { host, port, name, username, httpProxy, httpsProxy } = targetMachine;
    // Populate main control values
    this.targetMachineForm.patchValue({
      [TargetMachineFormControlNames.HOST]: host,
      [TargetMachineFormControlNames.PORT]: port,
      [TargetMachineFormControlNames.NAME]: name,
      [TargetMachineFormControlNames.USERNAME]: username,
      [TargetMachineFormControlNames.PRIVATE_KEY]: null,
    });
    // Populate private key file upload field
    this.privateKeyFileComponent$
      .pipe(
        takeUntil(this.unsubscribe$),
        filter(() => !!targetMachine.privateKeyFileName)
      )
      .subscribe((fileUploadFieldComponent: FileUploadFieldComponent) => {
        // Populate wb-file-upload-field with fake-selected file
        fileUploadFieldComponent.selectedFile = new File([], targetMachine.privateKeyFileName);
        // Set up form control value
        this.sshPrivateKeyControl.setValue(true);
        this.cdr.markForCheck();
      });
    // Populate proxy control values
    if (!isEmpty(httpProxy)) {
      this.useProxyControl.patchValue(true);
      this.useHttpProxyControl.patchValue(true);
      this.httpProxyForm.patchValue({ host: httpProxy.host, port: httpProxy.port });
      if (httpProxy.username) {
        this.useHttpProxyCredentialsControl.patchValue(true);
        this.httpProxyForm.patchValue({ username: httpProxy.username, password: httpProxy.password });
      }
    }
    if (!isEmpty(httpsProxy)) {
      if (!this.useProxyControl.value) {
        this.useProxyControl.patchValue(true);
      }
      this.useHttpsProxyControl.patchValue(true);
      this.httpsProxyForm.patchValue({ host: httpsProxy.host, port: httpsProxy.port });
      if (httpsProxy.username) {
        this.useHttpsProxyCredentialsControl.patchValue(true);
        this.httpsProxyForm.patchValue({ username: httpsProxy.username, password: httpsProxy.password });
      }
    }
    // Trigger material controls validation
    this.targetMachineForm.markAllAsTouched();
  }

  ngAfterViewInit(): void {
    this.privateKeyFileComponent$.next(this.privateKeyFileComponent);
    this.privateKeyFileComponent$.complete();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
