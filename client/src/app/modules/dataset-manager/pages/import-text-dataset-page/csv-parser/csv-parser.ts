import { parse as parseCSV, ParseLocalConfig, Parser, ParseResult, ParseStepResult } from 'papaparse';

interface ParserOptions {
  separator?: string;
  limitLines?: number;
  encoding?: string;
}

const DEFAULTS_OPTIONS: ParserOptions = {
  limitLines: 20,
  encoding: 'utf-8',
  separator: ',',
};

export function parse(file: File, options: ParserOptions = DEFAULTS_OPTIONS): Promise<string[][]> {
  return new Promise<string[][]>((resolve, reject) => {
    const parseResult: string[][] = [];

    const config: ParseLocalConfig<string[]> = {
      delimiter: options.separator,
      header: false,
      skipEmptyLines: true,
      preview: options.limitLines,
      encoding: options.encoding,
      step(results: ParseStepResult<string[]>, parser: Parser) {
        parseResult.push(results.data);

        if (parseResult.length === options.limitLines) {
          parser.abort();
        }
      },
      complete: () => resolve(parseResult),
      error: (error: Error) => reject(error),
    };

    parseCSV(file, config);
  });
}

interface DetectorOptions extends ParserOptions {
  delimitersToGuess: string[];
}

export async function detectSeparator(file: File, options: DetectorOptions): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let delimiter: string = null;

    const config: ParseLocalConfig<string[]> = {
      delimitersToGuess: options.delimitersToGuess,
      header: false,
      skipEmptyLines: true,
      preview: options.limitLines,
      encoding: options.encoding,
      // 1mb
      chunkSize: 1024 * 1024,
      chunk(results: ParseResult<string[]>, parser: Parser) {
        delimiter = results.meta.delimiter;
        parser.abort();
      },
      complete: () => resolve(delimiter),
      error: (error: Error) => reject(error),
    };

    parseCSV(file, config);
  });
}
