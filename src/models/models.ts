// export class Money {
//   constructor(
//     public amount: number,
//     public fraction: number,
//     public currency: string,
//   ) {}
// }

import type { components } from '@/schemas'

// export class Spending {
//   constructor(
//     public date: Date,
//     public money: Money,
//   ) {}
// }

export type Budget = components['schemas']['Budget']
export type Spending = components['schemas']['Spending']

export type SpendingCreateEvent = components['schemas']['SpendingCreateEvent']
export type SpendingUpdateEvent = components['schemas']['SpendingUpdateEvent']
export type SpendingDeleteEvent = components['schemas']['SpendingDeleteEvent']
export type ChangeSpendingEvent =
  | components['schemas']['SpendingCreateEvent']
  | components['schemas']['SpendingUpdateEvent']
  | SpendingDeleteEvent
