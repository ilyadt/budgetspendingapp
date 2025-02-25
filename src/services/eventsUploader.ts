import type { ChangeSpendingEvent } from '@/models/models'
import type { paths } from '@/schemas'
import type { Client } from 'openapi-fetch'
import createClient from 'openapi-fetch'
import { useStatusStore } from '@/stores/status'
import { useUploadErrorsStore } from '@/stores/uploadErrors'

class EventsUploader {
  private readonly storageKey = 'events_uploader__events'

  private storage: Storage
  private client: Client<paths>
  private events: Array<ChangeSpendingEvent>
  private $statusStore
  private $uploadErrorsStore

  private timerHandler: number = 0

  constructor() {
    this.storage = localStorage
    this.$statusStore = useStatusStore()
    this.$uploadErrorsStore = useUploadErrorsStore()
    this.client = createClient<paths>({ baseUrl: import.meta.env.VITE_SERVER_URL })
    this.events = JSON.parse(this.storage.getItem(this.storageKey) || '[]')
    this.$statusStore.setPendingEvents(this.events.length)

    // Try send on page refresh
    if (this.events.length > 0) {
      this.sendEvents()
    }
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

    if (this.timerHandler != 0) {
      clearTimeout(this.timerHandler)
    }

    this.sendEvents()
  }

  public async sendEvents() {
    if (this.events.length == 0) {
      return
    }

    try {
      const { response, error, data } = await this.client.POST('/budgets/spendings/bulk', {
        body: {
          updates: this.events,
        },
      })

      if (response.status != 200 && response.status != 400) {
        throw new Error('status: ' + response.status)
      }

      // Errors
      const errs = error?.errors || []
      for (const err of errs) {
        const index = this.events.findIndex((ev) => ev.eventId === err.eventId)

        if (index == -1) {
          console.error('unknown error event: ' + err.eventId)
          continue
        }

        this.$uploadErrorsStore.addEvent(this.events[index])
        this.events.splice(index, 1)
      }

      // Success
      const success = data?.success || error?.success || []
      for (const s of success) {
        // TODO:
        // this.events[i].status = 'applied' || race conditions on init
        const index = this.events.findIndex((ev) => ev.eventId === s)

        if (index == -1) {
          console.error('success unknown event: ' + s)
          continue
        }

        this.events.splice(index, 1)
      }

      this.$statusStore.setPendingEvents(this.events.length)
      this.$statusStore.setUpdateSpendingStatus('ok')
      this.flush()
    } catch (error) {
      console.log(error)
      if (error instanceof Error) {
        this.$statusStore.setUpdateSpendingStatus(error.message)
      }
      this.timerHandler = setTimeout(this.sendEvents, 30 * 1000)
    }
  }

  private flush() {
    this.storage.setItem(this.storageKey, JSON.stringify(this.events))
  }

  public getAllEvents(): Array<ChangeSpendingEvent> {
    return this.events
  }
}

let eventsUploaderInstance: EventsUploader

export function getEventsUploaderInstance() {
  if (eventsUploaderInstance == null) {
    eventsUploaderInstance = new EventsUploader()
  }

  return eventsUploaderInstance
}
