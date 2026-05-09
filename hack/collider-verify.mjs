import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

  try {
    await page.goto('http://localhost:3003/game')
    await page.waitForTimeout(4000)

    // 验证游戏是否加载成功
    const hasTestApi = await page.evaluate(() => typeof window.__testApi !== 'undefined')
    if (!hasTestApi) {
      console.log('Game not loaded properly (no __testApi)')
      process.exit(1)
    }

    // 验证碰撞检测：动态获取 collisionDetector 的 colliders
    const collidersInfo = await page.evaluate(async () => {
      try {
        const mod = await import('/src/game/utils/Collision.ts')
        const detector = mod.collisionDetector
        return {
          count: detector.colliders.length,
          boxes: detector.colliders.slice(0, 5).map((box) => ({
            minY: box.min.y,
            maxY: box.max.y,
            height: box.max.y - box.min.y,
            minX: box.min.x,
            maxX: box.max.x,
          })),
        }
      } catch (e) {
        return { error: e.message }
      }
    })

    console.log(JSON.stringify(collidersInfo, null, 2))

    if ('error' in collidersInfo) {
      console.log('Dynamic import failed:', collidersInfo.error)
    } else {
      console.log(`Found ${collidersInfo.count} colliders`)
      // 第一棵大树 height=14, setFromObject 应该计算出正的、较大的高度
      const firstHeight = collidersInfo.boxes[0]?.height ?? 0
      console.log(`First collider height: ${firstHeight.toFixed(2)}`)
      if (collidersInfo.count > 0 && firstHeight > 5) {
        console.log('PASS: Collision boxes present and sized for tall obstacles')
      } else if (collidersInfo.count > 0) {
        console.log('WARN: Collision boxes present but first height seems low')
      } else {
        console.log('FAIL: No collision boxes found')
      }
    }

    // 额外验证：通过玩家移动来验证碰撞是否工作
    const posBefore = await page.evaluate(() => window.__testApi.getPlayerPosition())
    console.log('Player position before:', posBefore)

    await browser.close()
  } catch (e) {
    console.error(e)
    await browser.close()
    process.exit(1)
  }
}

main()
