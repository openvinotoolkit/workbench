import { ModelTaskTypes } from '@store/model-store/model.model';

interface IBaseSettings {
  encoding: string;
  separator: string;
  header: boolean;
}

export interface IClassificationColumns {
  text: number;
  label: number;
}

export interface IEntailmentColumns {
  premise: number;
  hypothesis: number;
  label: number;
}

export interface ITextClassificationDatasetSettings extends IBaseSettings {
  taskType: ModelTaskTypes.TEXT_CLASSIFICATION;
  columns: IClassificationColumns;
}

export interface ITextualEntailmentDatasetSettings extends IBaseSettings {
  taskType: ModelTaskTypes.TEXTUAL_ENTAILMENT;
  columns: IEntailmentColumns;
}

export type ITextDatasetSettings = ITextClassificationDatasetSettings | ITextualEntailmentDatasetSettings;
