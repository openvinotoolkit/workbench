import { NgZone } from '@angular/core';

import { SchedulerLike, Subscription } from 'rxjs';

class LeaveZoneScheduler implements SchedulerLike {
  constructor(private zone: NgZone, private scheduler: SchedulerLike) {}

  schedule(...args): Subscription {
    return this.zone.runOutsideAngular(() => this.scheduler.schedule.apply(this.scheduler, args));
  }

  now(): number {
    return this.scheduler.now();
  }
}

class EnterZoneScheduler implements SchedulerLike {
  constructor(private zone: NgZone, private scheduler: SchedulerLike) {}

  schedule(...args): Subscription {
    return this.zone.run(() => this.scheduler.schedule.apply(this.scheduler, args));
  }

  now(): number {
    return this.scheduler.now();
  }
}

export function leaveZone(zone: NgZone, scheduler: SchedulerLike): SchedulerLike {
  return new LeaveZoneScheduler(zone, scheduler);
}

export function enterZone(zone: NgZone, scheduler: SchedulerLike): SchedulerLike {
  return new EnterZoneScheduler(zone, scheduler);
}
