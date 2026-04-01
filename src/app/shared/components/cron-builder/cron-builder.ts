import { Component, forwardRef, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

type FrequencyType = 'minutes' | 'hours' | 'daily' | 'weekly' | 'custom';

@Component({
  selector: 'cron-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './cron-builder.html',
  styleUrl: './cron-builder.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CronBuilderComponent),
      multi: true,
    },
  ],
})
export class CronBuilderComponent implements ControlValueAccessor, OnInit {

  frequency: FrequencyType = 'minutes';
  intervalMinutes = 5;
  intervalHours = 1;
  dailyHour = 9;
  dailyMinute = 0;
  weeklyDay = 'MON';
  weeklyHour = 9;
  weeklyMinute = 0;
  customCron = '';

  cronExpression = signal('0 */5 * * * ?');
  humanReadable = signal('Every 5 minutes');

  frequencyOptions = [
    { value: 'minutes', label: 'Every X minutes' },
    { value: 'hours',   label: 'Every X hours' },
    { value: 'daily',   label: 'Every day at' },
    { value: 'weekly',  label: 'Every week on' },
    { value: 'custom',  label: 'Custom cron' },
  ];

  minuteOptions = [1, 2, 5, 10, 15, 20, 30];
  hourOptions   = [1, 2, 3, 4, 6, 8, 12];
  hourOfDay     = Array.from({ length: 24 }, (_, i) => i);
  minuteOfHour  = Array.from({ length: 60 }, (_, i) => i);

  dayOptions = [
    { value: 'MON', label: 'Monday' },
    { value: 'TUE', label: 'Tuesday' },
    { value: 'WED', label: 'Wednesday' },
    { value: 'THU', label: 'Thursday' },
    { value: 'FRI', label: 'Friday' },
    { value: 'SAT', label: 'Saturday' },
    { value: 'SUN', label: 'Sunday' },
  ];

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.buildCron();
  }

  onFrequencyChange(): void {
    this.buildCron();
  }

  buildCron(): void {
    let cron = '';
    let human = '';

    switch (this.frequency) {
      case 'minutes':
        cron  = `0 */${this.intervalMinutes} * * * ?`;
        human = `Every ${this.intervalMinutes} minute${this.intervalMinutes > 1 ? 's' : ''}`;
        break;
      case 'hours':
        cron  = `0 0 */${this.intervalHours} * * ?`;
        human = `Every ${this.intervalHours} hour${this.intervalHours > 1 ? 's' : ''}`;
        break;
      case 'daily':
        cron  = `0 ${this.dailyMinute} ${this.dailyHour} * * ?`;
        human = `Every day at ${this.pad(this.dailyHour)}:${this.pad(this.dailyMinute)}`;
        break;
      case 'weekly':
        cron  = `0 ${this.weeklyMinute} ${this.weeklyHour} ? * ${this.weeklyDay}`;
        human = `Every ${this.weeklyDay} at ${this.pad(this.weeklyHour)}:${this.pad(this.weeklyMinute)}`;
        break;
      case 'custom':
        cron  = this.customCron;
        human = 'Custom schedule';
        break;
    }

    this.cronExpression.set(cron);
    this.humanReadable.set(human);
    this.onChange(cron);
    this.onTouched();
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  // ─── ControlValueAccessor ─────────────────────────────
  writeValue(value: string): void {
    if (value) {
      this.customCron = value;
      this.frequency = 'custom';
      this.cronExpression.set(value);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
