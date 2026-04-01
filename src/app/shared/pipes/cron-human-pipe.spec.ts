import { CronHumanPipe } from './cron-human-pipe';

describe('CronHumanPipe', () => {
  it('create an instance', () => {
    const pipe = new CronHumanPipe();
    expect(pipe).toBeTruthy();
  });
});
