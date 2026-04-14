import { test as base } from '@playwright/test'

export const test = base.extend({
  // 可以添加自定义 fixtures
})

export { expect } from '@playwright/test'