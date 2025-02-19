import type { ChangeSpendingEvent } from '@/models/models'
import type { paths } from '@/schemas'
import type { Client } from 'openapi-fetch'
import createClient from 'openapi-fetch'
import { useStatusStore } from '@/stores/status'

class EventsUploader {
  private readonly storageKey = 'events_uploader__events'

  private storage: Storage
  private client: Client<paths>
  private events: Array<ChangeSpendingEvent>
  private $statusStore

  constructor() {
    this.storage = localStorage
    this.$statusStore = useStatusStore()
    this.client = createClient<paths>({ baseUrl: 'https://budgetd.mdm' })
    this.events = JSON.parse(this.storage.getItem(this.storageKey) || '[]')
    this.$statusStore.setPendingEvents(this.events.length)
  }

  public AddEvent(event: ChangeSpendingEvent) {
    // TODO:
    // pendingEvents.push(event)->flush()->sendEvent(event)
    // 1.Ok ->removeFromPending(event)->flush->NotifyServerOkEvent(event)
    // 2.Net.Error ->addToPending(event)->flush
    // 3.LogicError ->removeFromPending(event)->flush->NotifyServerError(event)->sendToErrorService(event)
    this.events.push(event)
    this.$statusStore.setPendingEvents(this.events.length)

    this.flush()

    this.sendEvents()
  }

  public async sendEvents() {
    if (this.events.length == 0) {
      return
    }

    try {
      const { error } = await this.client.POST('/budgets/spendings/bulk', {
        body: {
          updates: this.events,
        },
      })

      if (error) {
        throw error
      }

      this.events = []
      this.$statusStore.setPendingEvents(0)
      this.$statusStore.setUpdateSpendingStatus("ok")
      this.flush()
    } catch(error) {
      console.log(error)
      if (error instanceof Error) {
        this.$statusStore.setUpdateSpendingStatus(error.message)
      }
      setTimeout(this.sendEvents, 30 * 1000)
    }
  }

  private flush() {
    this.storage.setItem(this.storageKey, JSON.stringify(this.events))
  }
}

let eventsUploaderInstance: EventsUploader

export function getEventsUploaderInstance() {
  if (eventsUploaderInstance == null) {
    eventsUploaderInstance = new EventsUploader();
  }

  return eventsUploaderInstance
}
