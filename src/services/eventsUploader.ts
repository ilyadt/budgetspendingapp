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
    this.client = createClient<paths>({ baseUrl: 'http://localhost:3333/' })
    this.events = JSON.parse(this.storage.getItem(this.storageKey) || '[]')
  }

  public AddEvent(event: ChangeSpendingEvent) {
    this.events.push(event)

    this.storage.setItem(this.storageKey, JSON.stringify(this.events))

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
  }
}

export const eventsUploaderInstance = new EventsUploader()
