import { TestUtils } from './test-utils';

export class MonacoEditorUtils {
  testUtils = new TestUtils();

  private getParamName = (string: string): string => string.split(':')[0].trim();
  // Replace "-" from first line in YAML config
  private clearEditorLine = (string: string): string => string.replace('-', ' ');

  private getIndentation = (string: string): number => string.length - string.trimLeft().length;

  private findParentByIdent = (index: number, indent: number, editorLines: string[]): string => {
    for (let i = index; i >= 0; i--) {
      const str: string = this.clearEditorLine(editorLines[i]);
      const currentIndent: number = this.getIndentation(str);

      if (currentIndent < indent) {
        return this.getParamName(str);
      }
    }
  };

  getParamValue = (index: number, config: { [key: string]: string }, editorLines: string[]): string => {
    const str: string = this.clearEditorLine(editorLines[index]);
    const indent: number = this.getIndentation(str);
    const paramName: string = this.getParamName(str);
    if (!config[paramName]) {
      const parentName = this.findParentByIdent(index, indent, editorLines);
      return config[parentName];
    }
    return config[paramName];
  };

  getLineIndexesWithPlaceholders = (editorLines: string[]): number[] => {
    return editorLines.reduce((acc, str, index) => {
      if (str.includes('REQUIRED')) {
        return [...acc, index];
      }
      return acc;
    }, []);
  };

  updatePlaceholdersWithConfig = async (config: { [key: string]: string }) => {
    const editorLines: string[] = await this.testUtils.advancedAccuracy.getCurrentConfigFromEditor();
    const indexes: number[] = this.getLineIndexesWithPlaceholders(editorLines);
    for (const index of indexes) {
      const value: string = this.getParamValue(index, config, editorLines);
      if (!value) {
        await this.testUtils.advancedAccuracy.clearEditorLineByIndex(index);
      } else {
        await this.testUtils.advancedAccuracy.replaceRequiredPlaceholderByIndex(index, value);
      }
    }
  };
}
