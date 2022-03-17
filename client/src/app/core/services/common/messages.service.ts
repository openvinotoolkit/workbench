import { Injectable } from '@angular/core';

import { Dictionary } from '@ngrx/entity';
import { get, isEmpty, reduce } from 'lodash';

import tooltipMessages from '../../../../assets/data/tooltip-messages.json';
import hintMessages from '../../../../assets/data/hint-messages.json';
import advisorMessages from '../../../../assets/data/precision-analysis-messages.json';
import errorMessages from '../../../../assets/data/error-messages.json';
import dialogMessages from '../../../../assets/data/dialog-messages.json';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  public tooltipMessages = tooltipMessages;
  public hintMessages = hintMessages;
  public advisorMessages = advisorMessages;
  public errorMessages = errorMessages;
  public dialogMessages = dialogMessages;

  private static getNotFoundMessage(messageType: string, path: string): string {
    return `${messageType} message not found for path "${path}"`;
  }

  getVariableReplacer(key): RegExp {
    return new RegExp(`\\\${\\s*${key}\\s*}`, 'g');
  }

  getTooltip(featureName: string, parameterName: string): string {
    const notFoundMessage = MessagesService.getNotFoundMessage('Tooltip', [featureName, parameterName].join('.'));
    return get(this.tooltipMessages, [featureName, parameterName], notFoundMessage);
  }

  getDialog(featureName: string, parameterName: string): string {
    const notFoundMessage = MessagesService.getNotFoundMessage('Dialog', [featureName, parameterName].join('.'));
    return get(this.dialogMessages, [featureName, parameterName], notFoundMessage);
  }

  getError(featureName: string, parameterName: string): string {
    return get(this.errorMessages, [featureName, parameterName], parameterName);
  }

  getHint(featureName: string, parameterName: string, replaceValues?: Dictionary<string | number>): string {
    const notFoundMessage = MessagesService.getNotFoundMessage('Hint', [featureName, parameterName].join('.'));
    const message = get(this.hintMessages, [featureName, parameterName], notFoundMessage);
    return !isEmpty(replaceValues)
      ? reduce(
          replaceValues,
          (acc: string, value, key) => acc.replace(new RegExp(`\\\${\\s*${key}\\s*}`, 'g'), String(value)),
          message
        )
      : message;
  }

  getPrecisionAnalysisHint(
    featureName: string,
    parameterName: string,
    replaceSummaryValues?: Dictionary<string | number>,
    replaceStepValues?: Dictionary<string | number>
  ): { summary: string; nextSteps: string; theory?: string; testId?: string } {
    const notFoundMessage = MessagesService.getNotFoundMessage('Advisor', [featureName, parameterName].join('.'));
    const message = get(this.advisorMessages, [featureName, parameterName], notFoundMessage);

    return {
      ...message,
      summary: reduce(
        replaceSummaryValues,
        (summary, value, key) => summary.replace(this.getVariableReplacer(key), `${value}`),
        message.summary
      ),
      nextSteps: reduce(
        replaceStepValues,
        (nextSteps, value, key) => nextSteps.replace(this.getVariableReplacer(key), `${value}`),
        message.nextSteps
      ),
      testId: parameterName,
    };
  }

  getHintsMap<T>(featureName: string, keys: string[]): T {
    return this.getMessagesMap(this.getHint, featureName, keys);
  }

  private getMessagesMap<T>(
    messageGetter: (featureName: string, key: string) => string,
    featureName: string,
    keys: string[]
  ): T {
    return reduce<string, T>(
      keys,
      (acc, messageKey: string) => {
        const message = messageGetter.call(this, featureName, messageKey);
        if (message) {
          acc[messageKey] = message;
        }
        return acc;
      },
      {} as T
    );
  }
}
