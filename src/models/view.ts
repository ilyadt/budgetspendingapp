import { Facade } from '@/facade'
import { from, moneyFormat, type Currency } from '@/helpers/money'
import { type Budget, type Spending, genVersion, genSpendingID } from './models'

interface SaveData {
  id: string
  dt: Date
  version: string
  budgetId: number
  currency: Currency
  description: string
  amountFull: number
}

interface DeleteData {
  dt: Date
  version: string
}

class PendingSpendingRow {
  public initId: string
  public initBudgetId: number | null
  public initHash: string

  constructor(
    public id: string,
    public budgetId: number | null,
    public currency: Currency | null,
    public description: string,
    public amountFull: string,
    public sp: SpendingRow, // Link to creator
  ) {
    this.initId = id
    this.initBudgetId = budgetId
    this.initHash = this.hash(budgetId, amountFull, description)
  }

  private hash(budgetId: number | null, money: string, description: string): string {
    return `${budgetId ?? 'null'}|${money}|${description}`
  }

  public setBudget(b: Budget) {
    this.budgetId = b.id
    this.currency = b.money.currency
    this.id = (b.id == this.initBudgetId) ? this.initId : genSpendingID();
  }

  public save(dt: Date) {
    // Бюджет должен быть выбран
    if (!this.budgetId) {
      window.alert('не выбран бюджет')
      return
    }

    if (!this.currency) {
      window.alert('не выбрана валюта')
      return
    }

    const amountFull = Number(this.amountFull)

    if (!amountFull) {
      window.alert('пустая сумма')
      return
    }

    this.sp.saveChanges({
      id: this.id,
      budgetId: this.budgetId,
      currency: this.currency,
      version: genVersion(),
      dt: dt,
      description: this.description,
      amountFull: amountFull,
    })
  }

  public cancel() {
    const hash = this.hash(this.budgetId, this.amountFull, this.description)

    if ((hash != this.initHash) && !window.confirm(`Отменить изменение "${this.description}" ?`)) {
      return
    }

    this.sp.cancelChanges()
  }
}

export class SpendingRow {
  constructor(
    public id: string,
    public budgetId: number | null, // null if cross-budget
    public currency: Currency | null, // null for cross-budget
    public version: string | null, // null if new
    public date: Date,
    public sort: number,
    public amountFull: number,
    public description: string,
    public createdAt: Date | null,
    public updatedAt: Date | null,

    public pending: PendingSpendingRow | null,
    public destroy: ((self: SpendingRow) => void) | null,
  ) {}

  public saveChanges(data: SaveData): void {
    // External send
    const isNew = !this.version
    const budgetChanged = this.budgetId != data.budgetId
    const sendData: Spending = {
      id: data.id,
      version: data.version,
      prevVersion: this.version ?? undefined,
      date: this.date,
      sort: this.sort,
      money: from(data.amountFull, data.currency),
      description: data.description,
      createdAt: this.version ? this.createdAt! : data.dt,
      updatedAt: data.dt,
    }

    if (isNew) {
      Facade.createSpending(data.budgetId, sendData)
    } else if (budgetChanged) {
      Facade.deleteSpending(this.budgetId!, {...sendData, id: this.id})
      Facade.createSpending(data.budgetId, sendData)
    } else {
      Facade.updateSpending(data.budgetId, sendData)
    }

    // end External

    // Save changes
    this.id = data.id
    this.pending = null
    this.budgetId = data.budgetId
    this.currency = data.currency
    this.description = data.description
    this.amountFull = moneyFormat(from(data.amountFull, data.currency))
    this.updatedAt = data.dt
    if (!this.version) {
      this.createdAt = data.dt
    }
    this.version = data.version
  }

  public cancelChanges(): void {
    this.pending = null
    if (!this.version) {
      this.destroy?.(this)
    }
  }

  public toPending(): void {
    this.pending = new PendingSpendingRow(
      this.id,
      this.budgetId,
      this.currency,
      this.description,
      String(this.amountFull || ''),
      this,
    )
  }

  public delete(data: DeleteData) {
    if (!window.confirm(`Удалить запись "${this.description}" ?`)) {
      return
    }

    Facade.deleteSpending(this.budgetId!, {
      id: this.id,
      version: data.version,
      prevVersion: this.version!,
      updatedAt: data.dt,
    })

    this.destroy?.(this)
  }
}
