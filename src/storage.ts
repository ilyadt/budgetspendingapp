import type { Budget, Spending as ApiSpending } from '@/models/models'
import type { Money } from './helpers/money'
import '@/helpers/date' // For date prototypes

export interface Spending {
  id: string
  version: string
  parentVersion?: string
  date: Date
  sort: number
  money: Money
  description: string
  createdAt: Date
  updatedAt: Date
}

export enum VersionStatus {
  InDb = 'FROM_BACKEND', // версия, полученная с бека
  Pending = 'PENDING', // версия, которая применена, но еще не синхронизирована с беком (нужно для оффлайн работы)

  // версия, PENDING -> APPLIED, статус означает, что версия применена на беке, но сохраняем ее на случай если с бека будут приходить еще старая версия
  // READ lag
  Applied = 'APPLIED',
}

type RevokedVersions = SpendingVersion[]

export interface SpendingVersion {
  // Заполняется только, когда отдаются RevokedVersions
  spendingId?: string
  // Пока это не нужно
  // version: number, // порядковый номер версии 1,2,3,4,5 ....
  // TODO: version -> versionHash (более точное название)
  version: string // хеш версии (рандомные), для того, чтобы строить правильные связи ver1 -> ver2 -> ver3

  // Пока это не нужно, ограничимся проверками на добавление / изменение
  // parentVersionHash: string | null, // хеш родительской версии для того, чтобы применять (как в блокчейне)
  status: VersionStatus
  // Relevant for Applied only
  statusAt?: Date
  date?: Date | string
  description?: string
  money?: Money
  sort?: number
  updatedAt: Date | string
  deleted?: boolean
}

const SpendingVersionProto = {
  // Final status
  isFinal(this: SpendingVersion): boolean {
    return this.deleted == true
  },
}

function withProto(obj: SpendingVersion): SpendingVersion & typeof SpendingVersionProto {
  return Object.setPrototypeOf(obj, SpendingVersionProto)
}

interface SpendingVersioned {
  id: string
  createdAt: Date
  versions: SpendingVersion[]
}

interface StorageInterface {
  // -----------------------------------------------------------------
  // Методы получения данных из стора

  getBudgets(): Budget[]
  spendingsByBudgetId(bid: number): Spending[]
  spendingsByBudgetIds(bids: number[]): Spending[]

  // -----------------------------------------------------------------

  // Синхронные методы, используемые UI для манипуляции с Spending ДО всякого взаимодействия с беком
  // Они должны отрабатывать без ошибок. В случае ошибки не давать пользователю сохранять действие

  /**
   * Creates a new spending.
   * @throws Error if already there
   */
  createSpending(bid: number, sp: Spending): void

  /**
   * @throws Error if not exist / cannot be applied
   */
  updateSpending(bid: number, sp: Spending): void

  // Silently skips if not there
  // fields: id, version, prevVersion, updatedAt / deletedAt /,
  // @throws Error if not exist / cannot be applied
  deleteSpending(bid: number, sp: Spending): void

  // -----------------------------------------------------------------

  // Методы, синхронизации с беком

  // Железная логика по сохранению бюджетов (перетирание всех данных по бюджету, даже spendings)
  // (если бюджет исчез, то предполагается, что в него никак нельзя добавить данные, поэтому все pending Spending's будут нерелевантны)
  // в дальнейшем можно предусмотреть возвращение удаленных Pending
  storeBudgetsFromRemote(bs: Budget[]): void

  // Поэлементное spendingID, сравнение текущих данных и новых.
  // Новые данные имеют точку правды, все несоответствующие pending переносятся в <Error Storage>.
  storeSpendingsFromRemote(bid: number, sps: ApiSpending[]): RevokedVersions

  // После доставки обновления на бек изменяем статус версии в Storage
  setStatusApplied(bid: number, spId: string, version: string): void

  // Если произошел конфликт обновления (обновление не может быть применено), то удаляем эту версию из Storage,
  // возвращая удаленные(не примененные) версии
  revokeConflictVersion(bid: number, spId: string, version: string): RevokedVersions
}

const lsPrefix = 'storage'

function lsSpendingsKey(bid: number): string {
  return `${lsPrefix}:b:${bid}:spendings`
}

function lsBudgetsKey(): string {
  return `${lsPrefix}:budgets`
}

export const Storage: StorageInterface = {
  getBudgets(): Budget[] {
    const raw = localStorage.getItem(lsBudgetsKey())

    return raw ? JSON.parse(raw) : []
  },

  spendingsByBudgetId(bid: number): Spending[] {
    const fromStore: SpendingVersioned[] = JSON.parse(
      localStorage.getItem(lsSpendingsKey(bid)) || '[]',
    )

    const res: Spending[] = []

    for (const spVersioned of fromStore) {
      const lastVer = spVersioned.versions.at(-1)!

      if (lastVer.deleted) {
        continue
      }

      res.push({
        id: spVersioned.id,
        version: lastVer.version!,
        date: new Date(lastVer.date!),
        sort: lastVer.sort!,
        money: lastVer.money!,
        description: lastVer.description!,
        createdAt: new Date(spVersioned.createdAt),
        updatedAt: new Date(lastVer.updatedAt),
      })
    }

    return res
  },

  spendingsByBudgetIds(bids: number[]): Spending[] {
    return bids.flatMap(bid => this.spendingsByBudgetId(bid));
  },

  createSpending(bid: number, newSp: Spending): void {
    assertBudget(bid)

    const spendingsFromLS: SpendingVersioned[] = JSON.parse(
      localStorage.getItem(lsSpendingsKey(bid)) ?? '[]',
    )
    const idx = spendingsFromLS.findIndex((s) => s.id >= newSp.id)

    // Дополнительная проверка. Предполагается, что ID создается на клиенте всегда уникальный
    if (idx !== -1 && spendingsFromLS[idx]!.id === newSp.id) {
      throw new Error('spending already exists')
    }

    const newSpVersioned: SpendingVersioned = {
      id: newSp.id,
      createdAt: newSp.createdAt,
      versions: [
        {
          version: newSp.version,
          status: VersionStatus.Pending,
          date: newSp.date,
          description: newSp.description,
          money: newSp.money,
          sort: newSp.sort,
          updatedAt: newSp.updatedAt,
          deleted: false,
        },
      ],
    }

    const insertIdx = idx === -1 ? spendingsFromLS.length : idx

    spendingsFromLS.splice(insertIdx, 0, newSpVersioned)

    localStorage.setItem(lsSpendingsKey(bid), JSON.stringify(spendingsFromLS))
  },

  updateSpending(bid: number, upd: Spending): void {
    assertBudget(bid)

    const fromStore: SpendingVersioned[] = JSON.parse(
      localStorage.getItem(lsSpendingsKey(bid)) ?? '[]',
    )

    const sp = fromStore.find((s) => s.id == upd.id)

    if (!sp) {
      throw new Error('spending not found')
    }

    const lastVer = withProto(sp.versions.at(-1)!)

    if (lastVer.isFinal()) {
      throw new Error('spending cannot be changed')
    }

    if (upd.parentVersion != lastVer.version) {
      throw new Error('invalid parent version')
    }

    sp.versions.push({
      version: upd.version,
      status: VersionStatus.Pending,
      date: upd.date,
      description: upd.description,
      money: upd.money,
      sort: upd.sort,
      updatedAt: upd.updatedAt,
    })

    localStorage.setItem(lsSpendingsKey(bid), JSON.stringify(fromStore))
  },

  deleteSpending(bid: number, del: Spending): void {
    assertBudget(bid)

    const fromStore: SpendingVersioned[] = JSON.parse(
      localStorage.getItem(lsSpendingsKey(bid)) ?? '[]',
    )

    const sp = fromStore.find((s) => s.id == del.id)
    if (!sp) {
      throw new Error('spending not found')
    }

    const lastVer = withProto(sp.versions.at(-1)!)

    if (lastVer.isFinal()) {
      throw new Error('spending cannot be changed')
    }

    if (del.parentVersion != lastVer.version) {
      throw new Error('parent version is invalid')
    }

    sp.versions.push({
      version: del.version!,
      status: VersionStatus.Pending,
      updatedAt: del.updatedAt!,
      deleted: true,
    })

    localStorage.setItem(lsSpendingsKey(bid), JSON.stringify(fromStore))
  },

  storeBudgetsFromRemote(budgets: Budget[]): void {
    budgets.sort((b1, b2) => b1.id - b2.id)

    const raw = localStorage.getItem(lsBudgetsKey())
    const storageBudgets: Budget[] = raw ? JSON.parse(raw) : []

    const newIds = new Set(budgets.map((b) => b.id))
    const oldIds = new Set(storageBudgets.map((b) => b.id))

    const toDeleteBids = new Set([...oldIds].filter((id) => !newIds.has(id)))

    for (const delId of toDeleteBids) {
      localStorage.removeItem(lsSpendingsKey(delId))
    }

    localStorage.setItem(lsBudgetsKey(), JSON.stringify(budgets))
  },

  storeSpendingsFromRemote(bid: number, remoteSps: ApiSpending[]): SpendingVersion[] {
    assertBudget(bid)

    const localSps: SpendingVersioned[] = JSON.parse(
      localStorage.getItem(lsSpendingsKey(bid)) ?? '[]',
    )

    const remoteSpsIds = new Set(remoteSps.map((s) => s.id))
    const localSpsIds = new Set(localSps.map((s) => s.id))

    const remoteOnlyIds = new Set([...remoteSpsIds].filter((id) => !localSpsIds.has(id)))

    const result: SpendingVersioned[] = []

    const revoked: SpendingVersion[] = []

    // RemoteOnly:
    // создаем локальную версию из нее
    for (const sp of remoteSps.filter((sp) => remoteOnlyIds.has(sp.id))) {
      result.push({
        id: sp.id,
        createdAt: new Date(sp.createdAt),
        versions: [
          {
            version: sp.version,
            status: VersionStatus.InDb,
            date: new Date(sp.date),
            description: sp.description,
            money: sp.money,
            sort: sp.sort,
            updatedAt: new Date(sp.updatedAt),
            deleted: false,
          },
        ],
      })
    }

    // LocalOnly:
    // 1. Если создана локально (local: ver=1:status=PENDING), то оставляем. Или ver1,status=APPLIED, time<15s -> сохранена, но недоступна еще для чтения
    // 2. В обратном случае (=запись была удалена в нашей системе / в другой) все PENDING в ErrorStorage и не добавляем в res.
    const localOnlyIds = new Set([...localSpsIds].filter((id) => !remoteSpsIds.has(id)))

    for (const spVersioned of localSps.filter((sp) => localOnlyIds.has(sp.id))) {
      const ver1 = spVersioned.versions[0]!
      const ver1StatusAt = new Date(ver1.statusAt!)
      const spCreatedLocally =
        ver1.status == VersionStatus.Pending ||
        (ver1.status == VersionStatus.Applied && ver1StatusAt.lessThanSecondsAgo(15))
      if (spCreatedLocally) {
        result.push(spVersioned)
      }

      // Locally or Remote deleted
      const spDeleted =
        ver1.status == VersionStatus.InDb ||
        (ver1.status == VersionStatus.Applied && ver1StatusAt.moreThanSecondsAgo(15))
      if (spDeleted) {
        const revokedToPush = spVersioned.versions
          .filter((v) => v.status == VersionStatus.Pending)
          .map((v) => ({ ...v, spendingId: spVersioned.id }))

        revoked.push(...revokedToPush)
      }
    }

    // Remote and Local

    const remoteById: Map<string, ApiSpending> = new Map(remoteSps.map((sp) => [sp.id, sp]))
    const localById: Map<string, SpendingVersioned> = new Map(localSps.map((sp) => [sp.id, sp]))

    const intersectIds = new Set([...remoteSpsIds].filter((id) => localSpsIds.has(id)))
    const pairs: [SpendingVersioned, ApiSpending][] = [...intersectIds].map((id) => [
      localById.get(id)!,
      remoteById.get(id)!,
    ])

    for (const [localSpVersioned, remoteSp] of pairs) {
      const idx = localSpVersioned.versions.findIndex((v) => v.version == remoteSp.version)
      let versions: SpendingVersion[]

      if (idx == -1) {
        const revokedToPush = localSpVersioned.versions
          .filter((sp) => sp.status == VersionStatus.Pending)
          .map((v) => ({ ...v, spendingId: localSpVersioned.id }))

        revoked.push(...revokedToPush)

        versions = [
          {
            version: remoteSp.version,
            status: VersionStatus.InDb,
            date: new Date(remoteSp.date),
            description: remoteSp.description,
            money: remoteSp.money,
            sort: remoteSp.sort,
            updatedAt: new Date(remoteSp.updatedAt),
            deleted: false,
          },
        ]
      } else {
        versions = localSpVersioned.versions.slice(idx) // оставляем только версии начинающиеся с remote
        versions[0]!.status = VersionStatus.InDb
      }

      localSpVersioned.versions = versions

      result.push(localSpVersioned)
    }

    result.sort((s1, s2) => s1.id.localeCompare(s2.id))

    localStorage.setItem(lsSpendingsKey(bid), JSON.stringify(result))

    return revoked
  },

  setStatusApplied(bid: number, spId: string, version: string): void {
    const fromStore: SpendingVersioned[] = JSON.parse(
      localStorage.getItem(lsSpendingsKey(bid)) ?? '[]',
    )

    const spVersioned = fromStore.find((s) => spId == s.id)

    if (!spVersioned) {
      return
    }

    const storedVer = spVersioned.versions.find((ver) => ver.version == version)

    if (!storedVer) {
      return
    }

    storedVer.status = VersionStatus.Applied
    storedVer.statusAt = new Date()

    localStorage.setItem(lsSpendingsKey(bid), JSON.stringify(fromStore))
  },

  revokeConflictVersion(bid: number, spId: string, version: string): RevokedVersions {
    let fromStore: SpendingVersioned[] = JSON.parse(
      localStorage.getItem(lsSpendingsKey(bid)) ?? '[]',
    )

    const spVersionedIdx = fromStore.findIndex((s) => s.id == spId)

    if (spVersionedIdx == -1) {
      return []
    }

    const spVersioned = fromStore[spVersionedIdx]!

    const idx = spVersioned.versions.findIndex((ver) => ver.version == version)
    if (idx == -1) {
      return []
    }

    const revokedVersions = spVersioned.versions.slice(idx)

    spVersioned.versions = spVersioned.versions.slice(0, idx)

    if (spVersioned.versions.length == 0) {
      fromStore = fromStore.splice(spVersionedIdx, 0)
    }

    localStorage.setItem(lsSpendingsKey(bid), JSON.stringify(fromStore))

    for (const revVer of revokedVersions) {
      revVer.spendingId = spVersioned.id
    }

    return revokedVersions
  },
}

// Check budget exists
function assertBudget(bid: number) {
  const budgets: Budget[] = JSON.parse(localStorage.getItem(lsBudgetsKey()) ?? '[]')
  const b = budgets.find((b) => b.id === bid)
  if (!b) {
    throw new Error('not existing budget')
  }
}

export const _test = {
  lsBudgetsKey,
  lsSpendingsKey,
  lsPrefix,
}
