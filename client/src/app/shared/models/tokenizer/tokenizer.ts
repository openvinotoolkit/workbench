import { Artifact } from '@shared/models/artifact';

export enum TokenizerType {
  WORDPIECE = 'wordpiece',
  BPE = 'BPE',
}

export const TOKENIZER_TYPE_NAME = {
  [TokenizerType.WORDPIECE]: 'WordPiece',
  [TokenizerType.BPE]: 'BPE',
};

export interface ITokenizer extends Artifact {
  type: TokenizerType;
  vocabSize: number;
  selected: boolean;
}
