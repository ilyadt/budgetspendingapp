/* eslint-disable  @typescript-eslint/no-explicit-any */

import type { ChangeSpendingEvent } from '@/models/models'
import type { paths } from '@/schemas'
import type { Client } from 'openapi-fetch'
import createClient from 'openapi-fetch'
import { useStatusStore } from '@/stores/status'
import { useUploadErrorsStore } from '@/stores/uploadErrors'
import { useSpendingEventsStore } from '@/stores/spendingEvent'
import * as Sentry from '@sentry/vue'

class EventsUploader {
  private client: Client<paths>
  private events: Array<ChangeSpendingEvent>
  private $statusStore
  private $uploadErrorsStore

  private timerHandler: number = 0

  constructor() {
    this.$statusStore = useStatusStore()
    this.$uploadErrorsStore = useUploadErrorsStore()
    this.client = createClient<paths>({baseUrl: import.meta.env.VITE_SERVER_URL })
    this.events = useSpendingEventsStore().events
    this.$statusStore.setPendingEvents(this.events.filter((e) => e.status == 'pending').length)

    // Try to send on page refresh
    if (this.events.length > 0) {
      void this.sendEvents()
    }

    // Periodically clear applied events
    setTimeout(this.deleteAppliedEvents.bind(this), 20 * 24 * 60 * 60 * 1000) // 20 дней
  }

  public AddEvent(event: ChangeSpendingEvent) {
    // TODO:
    // pendingEvents.push(event)->flush()->sendEvent(event)
    // 1.Ok ->removeFromPending(event)->flush->NotifyServerOkEvent(event)
    // 2.Net.Error ->addToPending(event)->flush
    // 3.LogicError ->removeFromPending(event)->flush->NotifyServerError(event)->sendToErrorService(event)
    this.events.push(event)
    const pendingEvents = this.events.filter((e) => e.status === 'pending')
    this.$statusStore.setPendingEvents(pendingEvents.length)

    if (this.timerHandler != 0) {
      clearTimeout(this.timerHandler)
    }

    void this.sendEvents()
  }

  public async sendEvents() {
    if (this.events.length == 0) {
      return
    }

    try {
      const { response, error, data } = await this.client.POST('/budgets/spendings/bulk', {
        body: {
          updates: this.events.filter((e) => e.status == 'pending'),
        },
        signal: AbortSignal.timeout(10_000),
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
          Sentry.captureException('unknown error event: ' + err.eventId)
          continue
        }

        // race conditions
        if (this.events[index]!.status === 'applied') {
          continue
        }

        Sentry.captureException(
          'error uploading event: ' + err.error + ' ' + JSON.stringify(this.events[index]),
        )
        this.$uploadErrorsStore.addEvent(this.events[index]!)
        this.events.splice(index, 1)
      }

      // Success
      const success = data?.success || error?.success || []
      for (const s of success) {
        const index = this.events.findIndex((ev) => ev.eventId === s)

        if (index == -1) {
          console.error('success unknown event: ' + s)
          Sentry.captureException('success unknown event: ' + s)
          continue
        }
        this.events[index]!.status = 'applied'
      }

      this.$statusStore.setPendingEvents(this.events.filter((e) => e.status == 'pending').length)
      this.$statusStore.setUpdateSpendingStatus('ok')
    } catch (error: any) {
      this.$statusStore.setUpdateSpendingStatus(error.name + ' ' + error.message)
      console.error(error)
      Sentry.captureException(error)

      this.timerHandler = setTimeout(this.sendEvents.bind(this), 30 * 1000)
    }
  }

  private deleteAppliedEvents() {
    // TODO: удалять те, которые были применены после последнего обновления,
    // appliedTime + 10m(дельта лаг) < lastGetSpendingsTime
    this.events = this.events.filter((e) => e.status !== 'applied')
  }
}

let eventsUploaderInstance: EventsUploader

export function getEventsUploaderInstance() {
  if (eventsUploaderInstance == null) {
    eventsUploaderInstance = new EventsUploader()
  }

  return eventsUploaderInstance
}
