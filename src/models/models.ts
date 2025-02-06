// export class Money {
//   constructor(
//     public amount: number,
//     public fraction: number,
//     public currency: string,
//   ) {}
// }

import type { components } from "@/schemas"

// export class Spending {
//   constructor(
//     public date: Date,
//     public money: Money,
//   ) {}
// }

export type Budget = components['schemas']['Budget']
export type Spending = components['schemas']["Spending"]
