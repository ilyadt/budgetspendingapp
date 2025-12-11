import { Facade } from '@/facade'
import { from, moneyFormat, type Currency } from '@/helpers/money'
import { type Budget, type Spending, genVersion, genSpendingID } from './models'

export interface SaveData {
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

// ViewModel
export class PendingSpendingRow {
  public initSpId: string
  private _budgetId: number | null
  private initBudgetId: number | null
  private initHash: string

  // Back-link to the creator
  private sp: SpendingRow | null  = null

  // Back-link to the place where PendingSpendingRow lives (to destroy itself)
  public destroy: () => void = () => {};

  constructor(
    public rowNum: number,
    public spId: string,
    private version: string | null,
    budgetId: number | null,
    public date: Date,
    public currency: Currency | null,
    public description: string,
    public amountFull: string,
  ) {
    this.initSpId = spId
    this._budgetId = budgetId
    this.initBudgetId = budgetId
    this.initHash = this.hash(budgetId, amountFull, description)
  }

  private hash(budgetId: number | null, money: string, description: string): string {
    return `${budgetId ?? 'null'}|${money}|${description}`
  }

  public setBudget(b: Budget) {
    this._budgetId = b.id
    this.currency = b.money.currency
    this.spId = b.id == this.initBudgetId ? this.initSpId : genSpendingID()
  }

  public get budgetId(): number | null {
    return this._budgetId
  }

  public isNewEmpty(): boolean {
    const isNew = !this.version // TODO: version -> id
    const isEmpty = !this.description && !this.amountFull

    return isNew && isEmpty
  }

  public save(dt: Date) {
    const amountFull = Number(this.amountFull)
    if (!amountFull) {
      window.alert('пустая сумма')
      return
    }

    if (!this.description) {
      window.alert('пустое описание')
      return
    }

    if (!this.budgetId) {
      window.alert('не выбран бюджет')
      return
    }

    // Нет изменений
    const hash = this.hash(this.budgetId, this.amountFull, this.description) // TODO: +this.id
    if (hash == this.initHash) {
      this.destroy()
      this.sp?.cancelChanges()

      return
    }

    // Если бюджет изменился, то генерируем версии сначала
    const ver = this.budgetId != this.initBudgetId ? genVersion(null) : genVersion(this.version)

    this.sp?.saveChanges({
      id: this.spId,
      version: ver,
      budgetId: this.budgetId,
      currency: this.currency!,
      dt: dt,
      description: this.description,
      amountFull: amountFull,
    })
    this.destroy()
  }

  public setDestroyFn(fn: () => void): void {
    this.destroy = fn
  }

  public setOriginalSpending(sp: SpendingRow): void {
    this.sp = sp
  }

  public cancel() {
    const hash = this.hash(this.budgetId, this.amountFull, this.description)

    if (hash != this.initHash && !window.confirm(`Отменить изменение "${this.description}" ?`)) {
      return
    }

    this.destroy()
    this.sp?.cancelChanges()
  }
}

export interface DataTable {
  getRowNum(spId: string): number
  removeRowBySpId(spId: string): void
}

// ViewModel
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
      Facade.deleteSpending(this.budgetId!, { ...sendData, id: this.id })
      Facade.createSpending(data.budgetId, sendData)
    } else {
      Facade.updateSpending(data.budgetId, sendData)
    }

    // end External

    // Save changes
    this.id = data.id
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
    if (!this.version) {
      this.dt?.removeRowBySpId(this.id)
    }
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

    this.dt!.removeRowBySpId(this.id)
  }

  public dt: DataTable | undefined

  public setDataTable(dt: DataTable): void {
    this.dt = dt
  }

  public getRowNum(): number {
    return this.dt!.getRowNum(this.id)
  }

  public createPending(): PendingSpendingRow {
    const pending = new PendingSpendingRow(
      this.getRowNum(),
      this.id,
      this.version,
      this.budgetId,
      this.date,
      this.currency,
      this.description,
      String(this.amountFull || ''),
    )

    pending.setOriginalSpending(this)

    return pending
  }
}

export class Table {
  // Заполняется если таблица по бюджету, то заполняется бюджет
  public budget: Budget | null = null;

  constructor(
    public date: Date,
    public rows: SpendingRow[],
  ) {}

  addRow(sp: SpendingRow): void {
    sp.setDataTable(this)
    this.rows.push(sp)
  }

  getRowNum(spId: string): number {
    return this.rows.findIndex(sp => sp.id == spId)!
  }

  removeRowBySpId(spId: string): void {
    this.rows = this.rows.filter(s => s.id !== spId)
  }

  setBudget(b: Budget): void {
    this.budget = b
  }

  sort(): void {
    // сначала по id для стабильности при одинаковом sort
    this.rows.sort((a, b) => (a.id > b.id ? 1 : -1))

    // потом по sort
    this.rows.sort((a, b) => a.sort - b.sort)
  }

  addNewSpending(): SpendingRow {
    const sp = new SpendingRow(
      genSpendingID(),
      this.budget?.id ?? null,
      this.budget?.money.currency ?? null,
      null,
      this.date,
      Date.now(),
      0,
      '',
      null,
      null,
    )

    this.addRow(sp)

    return sp
  }
}
