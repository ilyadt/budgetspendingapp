import type { ChangeSpendingEvent } from '@/models/models'
import type { paths } from '@/schemas'
import type { Client } from 'openapi-fetch'
import createClient from 'openapi-fetch'

class EventsUploader {
  private readonly storageKey = 'events_uploader__events'

  private storage: Storage
  private client: Client<paths>
  private events: Array<ChangeSpendingEvent>

  constructor() {
    this.storage = localStorage
    this.client = createClient<paths>({ baseUrl: 'https://budgetd.mdm' })
    this.events = JSON.parse(this.storage.getItem(this.storageKey) || '[]')
  }

  public AddEvent(event: ChangeSpendingEvent) {
    // TODO:
    // pendingEvents.push(event)->flush()->sendEvent(event)
    // 1.Ok ->removeFromPending(event)->flush->NotifyServerOkEvent(event)
    // 2.Net.Error ->addToPending(event)->flush
    // 3.LogicError ->removeFromPending(event)->flush->NotifyServerError(event)->sendToErrorService(event)
    this.events.push(event)

    this.flush()

    this.sendEvents()
  }

  public async sendEvents() {
    if (this.events.length == 0) {
      return
    }

    const { error } = await this.client.POST('/budgets/spendings/bulk', {
      body: {
        updates: this.events,
      },
    })

    if (error) {
      console.log(error)
      setTimeout(this.sendEvents, 30 * 1000)
      return
    }

    this.events = []
    this.flush()
  }

  private flush() {
    this.storage.setItem(this.storageKey, JSON.stringify(this.events))
  }
}

export const eventsUploaderInstance = new EventsUploader()
