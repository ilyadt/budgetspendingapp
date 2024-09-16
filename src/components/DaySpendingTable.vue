<script setup>
  import IconMoveRow from './icons/IconMoveRow.vue';
</script>

<template>
  <row>
    <table class="table table-sm">
    <tbody>
      <tr>
        <td>
          <IconMoveRow />
        </td>
        <td class="text-end">109</td>
        <td>кола</td>
      </tr>
      <tr>
        <td>
          <IconMoveRow />
        </td>
        <td class="text-end">148</td>
        <td>мороженое</td>
      </tr>
      <tr>
        <td>
          <IconMoveRow />
        </td>
        <td class="text-end">66</td>
        <td>шоколад</td>
      </tr>
    </tbody>
  </table>
  </row>
  <row>
    <button type="button" class="btn btn-success btn-sm">+</button>
  </row>
</template>
