import { TokenizerType } from '@shared/models/tokenizer/tokenizer';

interface IBaseTokenizerDTO {
  name: string;
  lowerCase: boolean;
  vocabFile: File;
}

export interface IWordPieceTokenizerDTO extends IBaseTokenizerDTO {
  type: TokenizerType.WORDPIECE;
}

export interface ISentencePieceTokenizerDTO extends IBaseTokenizerDTO {
  type: TokenizerType.BPE;
  mergesFile: File;
}

export type ITokenizerDTO = IWordPieceTokenizerDTO | ISentencePieceTokenizerDTO;
