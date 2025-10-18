import { Uploader } from './api'
import type { Budget, DelSpending, Spending } from '@/models/models'
import { BudgetSpendingsStore } from './stores/budgetSpendings'

class FacadeImpl {
  constructor(
    private readonly composite: CudSpending,
    private readonly storage = BudgetSpendingsStore,
  ) {}

  getBudgets(): Budget[] {
    return this.storage.getBudgets()
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

//TODO: поменять эту историю назад: это было сделано из-за того, что иногда не доставляются обновления на бэк
// как попытка это изменить
export const Composite = createComposite([Uploader, BudgetSpendingsStore])

export const Facade = new FacadeImpl(Composite, BudgetSpendingsStore)
