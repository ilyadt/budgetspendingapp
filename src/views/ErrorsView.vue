<script setup lang="ts">
import { useConflictVersionStore } from '@/stores/conflictVersions'
import { format } from 'date-fns';

const conflictVersions = useConflictVersionStore()

// время|тип|payload|error|action
function deleteError(versionId: string) {
  conflictVersions.remove(versionId)
}
</script>

<template>
  <div>Errors</div>

  <div class="table-responsive" style="max-width: 100%; overflow-x: auto;">
    <table class="table table-bordered table-sm align-middle" style="table-layout: fixed; min-width: 500px">
      <thead>
        <tr>
          <th style="width: 80px">date</th>
          <th style="width: 210px">change</th>
          <th style="width: 35px">bid</th>
          <th style="width: 210px">reason</th>
          <th style="width: 30px"></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="ver in conflictVersions.conflictVersions" :key="ver.version">
          <tr>
            <td>
              <!-- TODO: move updatedAt at the top level -->
              {{ format(ver.revokedAt, 'HH:mm:ss dd.MM.yy') }}
            </td>
            <td>
              {{ ver.from + ' -> ' + ver.to }}
            </td>
            <td>
              {{ ver.budgetId }}
            </td>
            <td>
              {{ ver.reason }}
            </td>
            <td>
              <button
                @click="deleteError(ver.version)"
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
  </div>
</template>

<style scoped>
  .table-responsive {
    overflow-x: auto;
    max-width: 100%;
  }
</style>
