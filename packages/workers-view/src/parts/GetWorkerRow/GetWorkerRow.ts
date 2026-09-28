import { VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { DisplayedWorker } from '../WorkersState/WorkersState.ts'
import type * as WorkersViewStrings from '../WorkersViewStrings/WorkersViewStrings.ts'
import * as AriaRoles from '../AriaRoles/AriaRoles.ts'
import * as GetMemoryText from '../GetMemoryText/GetMemoryText.ts'

export const getWorkerRow = (worker: DisplayedWorker, showMemory: boolean, strings: typeof WorkersViewStrings): readonly VirtualDomNode[] => {
  const cells: VirtualDomNode[] = [
    { className: 'WorkersViewWorkerCell', role: AriaRoles.Cell, textContent: worker.name, type: VirtualDomElements.Td },
  ]
  if (showMemory) {
    cells.push({
      className: 'WorkersViewWorkerCell',
      role: AriaRoles.Cell,
      textContent: GetMemoryText.getMemoryText(worker.memory, strings),
      type: VirtualDomElements.Td,
    })
  }
  return [
    { ariaLabel: worker.name, childCount: cells.length, className: 'WorkersViewWorkerRow', role: AriaRoles.Row, type: VirtualDomElements.Tr },
    ...cells,
  ]
}
