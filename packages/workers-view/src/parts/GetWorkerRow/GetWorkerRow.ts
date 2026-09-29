import { VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { DisplayedWorker } from '../WorkersState/WorkersState.ts'
import type * as WorkersViewStrings from '../WorkersViewStrings/WorkersViewStrings.ts'
import * as AriaRoles from '../AriaRoles/AriaRoles.ts'
import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'
import * as GetMemoryText from '../GetMemoryText/GetMemoryText.ts'

export const getWorkerRow = (
  worker: DisplayedWorker,
  showMemory: boolean,
  strings: typeof WorkersViewStrings,
  selected: boolean,
  hasFocus: boolean,
): readonly VirtualDomNode[] => {
  let className = 'WorkersViewWorkerRow'
  if (selected) {
    className += ' WorkersViewWorkerRowSelected'
    className += hasFocus ? ' WorkersViewWorkerRowFocused' : ' WorkersViewWorkerRowBlurred'
  }
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
    {
      'aria-selected': selected,
      ariaLabel: worker.name,
      childCount: cells.length,
      className,
      'data-worker-id': worker.id,
      onClick: DomEventListenerFunctions.SelectWorker,
      onContextMenu: DomEventListenerFunctions.ShowWorkerContextMenu,
      role: AriaRoles.Row,
      type: VirtualDomElements.Tr,
    },
    ...cells,
  ]
}
