import { ParameterNamePipe } from './parameter-name.pipe';

describe('ParameterNamePipe', () => {
  it('create an instance', () => {
    const pipe = new ParameterNamePipe();
    expect(pipe).toBeTruthy();
  });
  it('should transform execOrder key to name', () => {
    const pipe = new ParameterNamePipe();
    const key = 'execOrder';
    const name = 'Execution Order';
    expect(pipe.transform(key)).toEqual(name);
  });
  it('should return the same key if name not found in map', () => {
    const pipe = new ParameterNamePipe();
    const key = 'asdasd';
    const expectedKey = 'Asdasd';
    expect(pipe.transform(key)).toEqual(expectedKey);
  });
});
