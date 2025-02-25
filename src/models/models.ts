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

export type SpendingCreateEvent = components['schemas']['SpendingCreateEvent'] & { status: string }
export type SpendingUpdateEvent = components['schemas']['SpendingUpdateEvent'] & { status: string }
export type SpendingDeleteEvent = components['schemas']['SpendingDeleteEvent'] & { status: string }

// export type internalStatus
export type ChangeSpendingEvent = SpendingCreateEvent | SpendingUpdateEvent | SpendingDeleteEvent

export type UpdateSpendingsError = components['schemas']['UpdateSpendingsError']
