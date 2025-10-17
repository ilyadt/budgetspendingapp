import { alphanumeric } from 'nanoid-dictionary'
import { customAlphabet } from 'nanoid/non-secure'

import type { Money } from '@/helpers/money'
import type { components } from '@/models/oaschema'

export const genSpendingID = customAlphabet(alphanumeric, 10)
export const genVersion = customAlphabet(alphanumeric, 5)

export type ApiBudget = components['schemas']['Budget']
export type ApiSpending = components['schemas']['Spending']
export type ApiSpendingEvent = components['schemas']['SpendingEvent']
export type ApiUpdateSpendingsErrorsResponse = components['schemas']['UpdateSpendingsErrorsResponse']
export type ApiUploadError = components['schemas']['UpdateSpendingsError']
export type ApiMoney = components['schemas']['Money']

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

export interface Budget {
  id: number
  alias: string
  name: string
  sort: number
  description?: string
  money: Money
  dateFrom: Date
  dateTo: Date
  params: {
    [key: string]: unknown
  }
}

export type DelSpending = Pick<Spending, 'id' | 'version' | 'prevVersion' | 'updatedAt'>

export interface ConflictVersion {
  version: string
  budgetId: number
  spendingId: string
  versionDt: Date
  conflictedAt: Date
  from: string | null // null - created
  to: string | null // null - deleted
  reason: string | null
}
