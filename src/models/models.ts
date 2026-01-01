import { alphanumeric } from 'nanoid-dictionary'
import { customAlphabet } from 'nanoid/non-secure'

import type { Money } from '@/helpers/money'
import type { components, paths } from '@/models/oaschema'
import { uuidv7 } from 'uuidv7'

export const genSpendingID = uuidv7

const hexSymbols5 = customAlphabet('0123456789abcdef', 5)

// null    -> v1-xxxxx
// xxxxx   -> yyyyy
// v1-3829f -> v2-xxxxx
export const genVersion = (prevVer: string | null): string => {
  if (prevVer === null) {
    return `v1-${hexSymbols5()}`
  }

  const match = prevVer.match(/^v(\d+)-([0-9a-f]{5})$/i)
  if (!match) {
    return customAlphabet(alphanumeric, 5)()
  }

  const nextNum = parseInt(match[1]!, 10) + 1

  return `v${nextNum}-${hexSymbols5()}`
}

export type ApiBudget = components['schemas']['Budget']
export type ApiSpending = components['schemas']['Spending']
export type ApiSpendingEvent = components['schemas']['SpendingEvent']
export type ApiUpdateSpendingsErrorsResponse = components['schemas']['UpdateSpendingsErrorsResponse']
export type ApiUploadError = components['schemas']['UpdateSpendingsError']
export type ApiMoney = components['schemas']['Money']
export type ApiSchemaPaths = paths

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

// Бюджет с остатком
export type BudgetWithLeft = Budget & { left: Money }

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
