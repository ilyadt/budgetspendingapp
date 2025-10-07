
import type { Money } from '@/helpers/money'
import type { components } from '@/schemas'

export type ApiBudget = components['schemas']['Budget']
export type ApiSpending = components['schemas']['Spending']
export type ApiSpendingEvent = components['schemas']['SpendingEvent']
export type ApiUpdateSpendingsErrorsResponse = components['schemas']['UpdateSpendingsErrorsResponse'] 

export interface Spending {
  id: string
  version: string
  prevVersion?: string
  date: Date
  sort: number
  money: Money
  description: string
  createdAt: Date
  updatedAt: Date
}

export type DelSpending = Pick<Spending, 'id' | 'version' | 'prevVersion' | 'updatedAt'>
