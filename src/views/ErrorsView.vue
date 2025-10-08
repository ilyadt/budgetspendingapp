<script setup lang="ts">
import { useConflictVersionStore } from '@/stores/conflictVersions'

const conflictVersions = useConflictVersionStore()

// время|тип|payload|error|action
function deleteError(versionId: string) {
  conflictVersions.remove(versionId)
}
</script>

<template>
  <div>Errors</div>

  <table class="table table-bordered table-sm align-middle" style="table-layout: fixed; min-width: 350px">
    <thead>
      <tr>
        <th style="width: 80px">date</th>
        <th style="width: 210px">payload</th>
        <th style="width: 30px"></th>
      </tr>
    </thead>
    <tbody>
      <template v-for="ver in conflictVersions.conflictVersions" :key="ver.version">
        <tr>
          <td>
            <!-- TODO: move updatedAt at the top level -->
            {{ ver.versionDt }}
          </td>
          <td>
            {{ ver.from + ' -> ' + ver.to }}
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
</template>
