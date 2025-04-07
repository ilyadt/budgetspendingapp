<script setup lang="ts">
import { dateISOFromString } from '@/helpers/date'
import { moneyToString } from '@/helpers/money'
import type { ChangeSpendingEvent, SpendingCreateEvent, SpendingUpdateEvent } from '@/models/models'
import { useUploadErrorsStore } from '@/stores/uploadErrors'

const errorsStore = useUploadErrorsStore()

// время|тип|payload|error|action

function deleteError(evId: string) {
  errorsStore.deleteEvent(evId)
}

function payload(ev: ChangeSpendingEvent): string {
  switch (ev.type) {
    case 'update': {
      const e = ev as SpendingUpdateEvent
      return moneyToString(e.money) + ' ' + e.description
    }
    case 'create': {
      const e = ev as SpendingCreateEvent
      return moneyToString(e.money) + ' ' + e.description
    }
    case 'delete': {
      return '<nothing to show>'
    }
  }

  return ''
}
</script>

<template>
  <div>Errors</div>

  <table
    class="table table-bordered table-sm align-middle"
    style="table-layout: fixed; min-width: 350px"
  >
    <thead>
      <tr>
        <th style="width: 80px">date</th>
        <th style="width: 70px">type</th>
        <th style="width: 70px">payload</th>
        <th style="width: 70px">error</th>
        <th style="width: 30px"></th>
      </tr>
    </thead>
    <tbody>
      <template v-for="err in errorsStore.errorEvents" :key="err.eventId">
        <tr>
          <td>
            {{ dateISOFromString(err.updatedAt) }}
          </td>
          <td>
            {{ err.type }}
          </td>
          <td>
            {{ payload(err) }}
          </td>
          <td>error</td>
          <td>
            <button
              @click="deleteError(err.eventId)"
              class="btn btn-warning btn-sm p-1 m-1"
              style="min-width: 20px; line-height: 1"
            >
              x
            </button>
          </td>
        </tr>
      </template>
    </tbody>
  </table>
</template>
