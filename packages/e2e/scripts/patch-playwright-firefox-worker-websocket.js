import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const file = join(import.meta.dirname, '..', '..', '..', 'node_modules', 'playwright-core', 'lib', 'coreBundle.js')
const before = `      _onWebSocketOpened(event) {
        const request2 = this._webSocketRequests.get(event.requestId);
        assert(request2);
        const response2 = this._webSocketResponses.get(event.requestId);
        assert(response2);
        this._webSocketRequests.delete(event.requestId);
        this._webSocketResponses.delete(event.requestId);
        this._page.frameManager.onWebSocketRequest(webSocketId(event.frameId, event.wsid), request2.headers);
        this._page.frameManager.onWebSocketResponse(webSocketId(event.frameId, event.wsid), response2.status, response2.statusText, response2.headers);
      }`
const after = `      _onWebSocketOpened(event) {
        const request2 = this._webSocketRequests.get(event.requestId);
        const response2 = this._webSocketResponses.get(event.requestId);
        if (!request2 || !response2) {
          this._webSocketRequests.delete(event.requestId);
          this._webSocketResponses.delete(event.requestId);
          return;
        }
        this._webSocketRequests.delete(event.requestId);
        this._webSocketResponses.delete(event.requestId);
        this._page.frameManager.onWebSocketRequest(webSocketId(event.frameId, event.wsid), request2.headers);
        this._page.frameManager.onWebSocketResponse(webSocketId(event.frameId, event.wsid), response2.status, response2.statusText, response2.headers);
      }`
const content = await readFile(file, 'utf8')

if (!content.includes(after)) {
  if (!content.includes(before)) {
    throw new Error('Could not patch Playwright Firefox worker WebSocket handler')
  }
  await writeFile(file, content.replace(before, after))
}
