
import { expect, test } from 'vitest'
import { genVersion } from './models'

test('genVersion', () => {
  expect(genVersion(null)).toMatch(/^v1-[0-9a-f]{5}$/)

  expect(genVersion('randomString')).toMatch( /^[0-9A-Za-z]{5}$/)

  expect(genVersion('v1-3829f')).toMatch(/^v2-[0-9a-f]{5}$/i)

  expect(genVersion('notaversion')).not.toEqual(genVersion('notaversion'))
})
