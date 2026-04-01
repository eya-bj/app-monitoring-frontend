import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cronHuman',
  standalone: true,
})
export class CronHumanPipe implements PipeTransform {
  transform(cron: string): string {
  if (!cron) return '—';

  const parts = cron.trim().split(/\s+/);
  if (parts.length < 6) return cron;

  const [sec, min, hour, day, month, weekday] = parts;

  // Every minute → 0 * * * * ?
  if (min === '*' && hour === '*') {
    return 'Every minute';
  }

  // Every X minutes → 0 */X * * * ?
  if (min.startsWith('*/') && hour === '*') {
    const x = min.split('/')[1];
    return `Every ${x} minute${+x > 1 ? 's' : ''}`;
  }

  // Every hour → 0 0 * * * ?
  if (min === '0' && hour === '*') {
    return 'Every hour';
  }

  // Every X hours → 0 0 */X * * ?
  if (hour.startsWith('*/') && min === '0') {
    const x = hour.split('/')[1];
    return `Every ${x} hour${+x > 1 ? 's' : ''}`;
  }

  // Every day at HH:MM → 0 MM HH * * ?
  if (
    !hour.startsWith('*') && !hour.startsWith('*/') &&
    !min.startsWith('*') && !min.startsWith('*/') &&
    day === '*' && (weekday === '?' || weekday === '*')
  ) {
    return `Every day at ${this.pad(+hour)}:${this.pad(+min)}`;
  }

  // Every week on DAY at HH:MM → 0 MM HH ? * DAY
  if (
    day === '?' &&
    !hour.startsWith('*') &&
    !min.startsWith('*') &&
    weekday !== '*' && weekday !== '?'
  ) {
    const dayLabel = this.getDayLabel(weekday);
    return `Every ${dayLabel} at ${this.pad(+hour)}:${this.pad(+min)}`;
  }

  // Fallback
  return cron;
}

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  private getDayLabel(day: string): string {
    const map: Record<string, string> = {
      MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
      THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday',
    };
    return map[day.toUpperCase()] ?? day;
  }
}
