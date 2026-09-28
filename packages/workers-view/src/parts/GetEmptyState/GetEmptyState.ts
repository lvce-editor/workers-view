import { VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { DisplayedWorker } from '../WorkersState/WorkersState.ts'
import type * as WorkersViewStrings from '../WorkersViewStrings/WorkersViewStrings.ts'
import * as AriaRoles from '../AriaRoles/AriaRoles.ts'

export const getEmptyState = (
  workers: readonly DisplayedWorker[],
  loaded: boolean,
  strings: typeof WorkersViewStrings,
): readonly VirtualDomNode[] => {
  if (workers.length > 0 || !loaded) return []
  return [{ className: 'WorkersViewEmptyState', role: AriaRoles.Status, textContent: strings.noWorkersAreRunning(), type: VirtualDomElements.P }]
}
