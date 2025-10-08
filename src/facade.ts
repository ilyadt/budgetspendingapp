import { Uploader } from './api'
import type { ApiBudget, DelSpending, Spending } from '@/models/models'
import { Storage } from './storage'

class FacadeImpl {
  constructor(
    private readonly composite: CudSpending,
    private readonly storage = Storage,
  ) {}

  getBudgets(): ApiBudget[] {
    return this.storage.getBudgets()
  }

  spendingsByBudgetIds(bids: number[]): Spending[] {
    return this.storage.spendingsByBudgetIds(bids)
  }

  spendingsByBudgetId(bid: number): Spending[] {
    return this.storage.spendingsByBudgetId(bid)
  }

  createSpending(bid: number, newSp: Spending): void {
    this.composite.createSpending(bid, newSp)
  }

  updateSpending(bid: number, upd: Spending): void {
    this.composite.updateSpending(bid, upd)
  }

  deleteSpending(bid: number, del: DelSpending): void {
    this.composite.deleteSpending(bid, del)
  }
}

export interface CudSpending {
  createSpending(bid: number, newSp: Spending): void
  updateSpending(bid: number, upd: Spending): void
  deleteSpending(bid: number, del: DelSpending): void
}

function createComposite(subjects: CudSpending[]): CudSpending {
  return {
    createSpending(bid, newSp) {
      subjects.forEach(s => s.createSpending(bid, newSp))
    },
    updateSpending(bid, upd) {
      subjects.forEach(s => s.updateSpending(bid, upd))
    },
    deleteSpending(bid, del) {
      subjects.forEach(s => s.deleteSpending(bid, del))
    },
  }
}

export const Composite = createComposite([Storage, Uploader])

export const Facade = new FacadeImpl(Composite, Storage)
