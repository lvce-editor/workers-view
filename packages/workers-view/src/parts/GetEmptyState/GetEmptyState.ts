import { VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { DisplayedWorker } from '../WorkersState/WorkersState.ts'
import * as AriaRoles from '../AriaRoles/AriaRoles.ts'
import * as WorkersViewStrings from '../WorkersViewStrings/WorkersViewStrings.ts'

export const getEmptyState = (workers: readonly DisplayedWorker[], loaded: boolean): readonly VirtualDomNode[] => {
  if (workers.length > 0 || !loaded) return []
  return [
    {
      className: 'WorkersViewEmptyState',
      role: AriaRoles.Status,
      textContent: WorkersViewStrings.noWorkersAreRunning(),
      type: VirtualDomElements.P,
    },
  ]
}
