import { SessionDurationPipe } from './session-duration.pipe';

describe('SessionDurationPipe', () => {
  it('create an instance', () => {
    const pipe = new SessionDurationPipe();
    expect(pipe).toBeTruthy();
  });
});
