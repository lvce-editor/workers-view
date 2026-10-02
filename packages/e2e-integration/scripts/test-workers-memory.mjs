import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const requireTests = createRequire(join(root, 'packages/extension-host-worker-tests/package.json'))
const { expect } = requireTests('@playwright/test')
const { _electron } = requireTests('playwright')
const { build } = createRequire(join(root, 'packages/build/package.json'))('esbuild')
const profile = await mkdtemp(join(tmpdir(), 'lvce-workers-memory-'))
const rendererPath = join(root, 'packages/renderer-worker/node_modules/@lvce-editor/renderer-process/dist/rendererProcessMain.js')
const rendererSource = await readFile(rendererPath, 'utf8')
const entry = '/packages/renderer-worker/src/rendererWorkerMain.ts'
assert.ok(rendererSource.includes(entry), 'Renderer entry must be clean')
const bundleUrl = '/packages/renderer-worker/dist/workersMemoryTestMain.js'
let app
try {
  await build({
    entryPoints: [join(root, 'packages/renderer-worker/src/rendererWorkerMain.ts')],
    outfile: join(root, bundleUrl),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    external: ['node:*', '/static/*', 'electron'],
    logLevel: 'error',
  })
  await writeFile(rendererPath, rendererSource.replace(entry, bundleUrl))
  const env = { ...process.env, DEV: '1', LVCE_ROOT: root, LVCE_SHARED_PROCESS_PATH: join(root, 'packages/shared-process/src/sharedProcessMain.ts') }
  delete env.ELECTRON_RUN_AS_NODE
  for (const key of ['CONFIG', 'DATA', 'STATE', 'CACHE']) env[`XDG_${key}_HOME`] = join(profile, key.toLowerCase())
  app = await _electron.launch({
    executablePath: createRequire(join(root, 'packages/main-process/node_modules/@lvce-editor/main-process/package.json'))('electron'),
    args: ['--no-sandbox', `--user-data-dir=${join(profile, 'chromium')}`, '.', profile],
    cwd: join(root, 'packages/main-process'),
    env,
  })
  const childEnv = await app.evaluate(() =>
    Object.fromEntries(['CONFIG', 'DATA', 'STATE', 'CACHE'].map((key) => [key, process.env[`XDG_${key}_HOME`]])),
  )
  for (const key of ['CONFIG', 'DATA', 'STATE', 'CACHE']) assert.equal(childEnv[key], join(profile, key.toLowerCase()))
  const downloads = join(profile, 'downloads')
  await app.evaluate(({ app }, path) => app.setPath('downloads', path), downloads)
  const page = await app.firstWindow()
  page.setDefaultTimeout(15000)
  await expect(page.locator('#Workbench')).toBeVisible({ timeout: 60000 })
  await app.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0]
    const debuggerApi = window.webContents.debugger
    const original = debuggerApi.sendCommand.bind(debuggerApi)
    const counts = { attach: 0, detach: 0, evaluate: 0, heap: 0, traceStart: 0, traceEnd: 0 }
    globalThis.workerMemoryCounts = counts
    debuggerApi.sendCommand = (method, ...args) => {
      if (method === 'Target.attachToTarget') counts.attach++
      if (method === 'Target.detachFromTarget') counts.detach++
      if (method === 'Runtime.evaluate') counts.evaluate++
      if (method === 'Runtime.getHeapUsage') counts.heap++
      if (method === 'Tracing.start') counts.traceStart++
      if (method === 'Tracing.end') counts.traceEnd++
      return original(method, ...args)
    }
  })
  const counts = () => app.evaluate(() => ({ ...globalThis.workerMemoryCounts }))
  const open = async () => {
    await page.getByRole('menuitem', { name: 'View', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Command Palette', exact: true }).click()
    const input = page.locator('[name="QuickPickInput"]')
    await expect(input).toBeVisible()
    await input.fill('>Developer: Open Workers View')
    await expect(page.getByRole('option', { name: 'Developer: Open Workers View', exact: true })).toBeVisible()
    await input.press('Enter')
    await expect(page.locator('.WorkersView')).toBeVisible()
    await expect(page.locator('.WorkersView')).toContainText(/\d+(\.\d+)? (KiB|MiB)/)
  }
  const close = async () => {
    const tab = page.locator('.MainTab').filter({ hasText: 'Workers' })
    await tab.hover()
    await tab.locator('.EditorTabCloseButton').click()
    await expect(page.locator('.WorkersView')).toHaveCount(0)
    await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.debugger.isAttached())).toBe(false)
  }
  await open()
  // Wait for at least three complete batches, including the first load.
  await expect
    .poll(async () => {
      const value = await counts()
      return value.heap >= value.evaluate * 3 && value.evaluate > 0
    })
    .toBe(true)
  const first = await counts()
  await expect.poll(async () => (await counts()).heap).toBeGreaterThan(first.heap + first.evaluate)
  const repeated = await counts()
  assert.equal(repeated.evaluate, first.evaluate, 'unchanged workers must not have their names reevaluated')
  assert.equal(repeated.attach, first.attach, 'polling must reuse existing debugger sessions')
  assert.equal(repeated.detach, 0, 'polling must not detach debugger sessions')
  await expect.poll(async () => (await counts()).heap).toBeGreaterThan(repeated.heap)
  assert.equal((await counts()).evaluate, first.evaluate, 'automatic refresh must also reuse cached names')
  assert.equal(repeated.traceStart, first.traceStart, 'steady CPU polling must not start more traces')
  assert.equal(repeated.traceEnd, repeated.traceStart, 'discovery trace must have ended')
  await expect(page.getByRole('button', { name: 'CPU (%)', exact: true })).toBeVisible()
  const target = await app.evaluate(async ({ BrowserWindow }) => {
    const debuggerApi = BrowserWindow.getAllWindows()[0].webContents.debugger
    const { targetInfos } = await debuggerApi.sendCommand('Target.getTargets')
    const workers = targetInfos.filter((target) => target.type === 'worker' && /^\[worker-\d+\]/.test(target.title))
    const busy = workers.find((target) => !target.title.includes('Workers View Worker'))
    const idle = workers.find((target) => target.title.includes('Workers View Worker'))
    if (!busy || !idle) throw new Error('Expected two independently tracked workers')
    const { sessionId } = await debuggerApi.sendCommand('Target.attachToTarget', { targetId: busy.targetId, flatten: true })
    const { exceptionDetails } = await debuggerApi.sendCommand(
      'Runtime.evaluate',
      {
        expression:
          'globalThis.__cpuAcceptanceTimer = setInterval(() => { const end = performance.now() + 70; while (performance.now() < end) {} }, 100)',
      },
      sessionId,
    )
    if (exceptionDetails) throw new Error('Could not start worker CPU workload')
    return { busyId: busy.title.match(/^\[([^\]]+)\]/)[1], idleId: idle.title.match(/^\[([^\]]+)\]/)[1], sessionId }
  })
  const busyCpu = page.locator(`[data-worker-id="${target.busyId}"] .WorkersViewWorkerCell`).nth(2)
  const idleCpu = page.locator(`[data-worker-id="${target.idleId}"] .WorkersViewWorkerCell`).nth(2)
  try {
    await expect.poll(async () => Number(await busyCpu.textContent())).toBeGreaterThan(30)
    await expect.poll(async () => Number(await idleCpu.textContent())).toBeLessThan(20)
    console.log(`PASS: live CPU cells busy=${await busyCpu.textContent()}%, idle=${await idleCpu.textContent()}%`)
    if (process.env.LVCE_CPU_SCREENSHOT) await page.screenshot({ path: process.env.LVCE_CPU_SCREENSHOT })
  } finally {
    await app.evaluate(async ({ BrowserWindow }, sessionId) => {
      const debuggerApi = BrowserWindow.getAllWindows()[0].webContents.debugger
      await debuggerApi.sendCommand(
        'Runtime.evaluate',
        { expression: 'clearInterval(globalThis.__cpuAcceptanceTimer); delete globalThis.__cpuAcceptanceTimer' },
        sessionId,
      )
      await debuggerApi.sendCommand('Target.detachFromTarget', { sessionId })
    }, target.sessionId)
  }
  await expect.poll(async () => Number(await busyCpu.textContent())).toBeLessThan(20)
  await close()
  const closed = await counts()
  // Observe more than one polling interval to detect a leaked update timer.
  await page.waitForTimeout(1500)
  assert.deepEqual(await counts(), closed)
  await open()
  await expect.poll(async () => (await counts()).evaluate).toBeGreaterThan(closed.evaluate)
  await close()
  await open()
  const workerViewRow = page.locator('.WorkersViewWorkerRow').filter({ hasText: 'Workers View Worker' })
  await expect(workerViewRow).toBeVisible()
  // eslint-disable-next-line e2e/no-direct-click, @typescript-eslint/no-deprecated -- Open the worker's real context menu.
  await workerViewRow.click({ button: 'right' })
  const takeHeapSnapshot = page.getByRole('menuitem', { name: 'Take Heap Snapshot', exact: true })
  await expect(takeHeapSnapshot).toBeVisible()
  await takeHeapSnapshot.click()
  await expect(page.locator('.MainTabSelected[title$=".heapsnapshot"]')).toBeVisible({ timeout: 60000 })
  const snapshots = (await readdir(downloads)).filter((name) => name.endsWith('.heapsnapshot'))
  assert.equal(snapshots.length, 1)
  const snapshot = JSON.parse(await readFile(join(downloads, snapshots[0]), 'utf8'))
  assert.ok(snapshot.snapshot.meta.node_fields.includes('name'))
  assert.ok(snapshot.nodes.length > 0)
  console.log(`PASS: ${first.evaluate} worker names evaluated once; repeated heap polling, automatic refresh, close, and reopen verified`)
  console.log('PASS: Electron context menu opened a heap snapshot for the Workers View worker')
} finally {
  try {
    await app?.close()
  } finally {
    await writeFile(rendererPath, rendererSource)
    await rm(profile, { recursive: true, force: true })
  }
}
