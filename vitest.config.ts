import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Node environment only: the functions under test are pure and take plain
    // JSON, so nothing here needs a DOM.
    environment: 'node',
  },
})
