import { VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { DisplayedWorker } from '../WorkersState/WorkersState.ts'
import * as AriaRoles from '../AriaRoles/AriaRoles.ts'
import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'
import * as FormatMemoryRate from '../FormatMemoryRate/FormatMemoryRate.ts'
import * as GetMemoryText from '../GetMemoryText/GetMemoryText.ts'
import * as WorkersViewStrings from '../WorkersViewStrings/WorkersViewStrings.ts'

const getMemoryCell = (worker: DisplayedWorker): VirtualDomNode[] => {
  if (!worker.memoryTrend) {
    return [
      {
        className: 'WorkersViewWorkerCell',
        role: AriaRoles.Cell,
        textContent: GetMemoryText.getMemoryText(worker.memory),
        type: VirtualDomElements.Td,
      },
    ]
  }
  const growing = worker.memoryTrend.direction === 'growing'
  const rate = FormatMemoryRate.formatMemoryRate(worker.memoryTrend.bytesPerSecond)
  const memoryChildren: VirtualDomNode[] = [
    { className: 'WorkersViewMemory', textContent: GetMemoryText.getMemoryText(worker.memory), type: VirtualDomElements.Span },
    {
      ariaLabel: growing ? WorkersViewStrings.memoryGrowing(rate) : WorkersViewStrings.memoryShrinking(rate),
      className: growing ? 'WorkersViewMemoryTrend WorkersViewMemoryTrendGrowing' : 'WorkersViewMemoryTrend WorkersViewMemoryTrendShrinking',
      textContent: `${growing ? '↑' : '↓'} ${rate}`,
      type: VirtualDomElements.Span,
    },
  ]
  return [
    { childCount: memoryChildren.length, className: 'WorkersViewWorkerCell', role: AriaRoles.Cell, type: VirtualDomElements.Td },
    ...memoryChildren,
  ]
}

export const getWorkerRow = (worker: DisplayedWorker, showMemory: boolean, selected: boolean, hasFocus: boolean): readonly VirtualDomNode[] => {
  let className = 'WorkersViewWorkerRow'
  if (selected) {
    className += ' WorkersViewWorkerRowSelected'
    className += hasFocus ? ' WorkersViewWorkerRowFocused' : ' WorkersViewWorkerRowBlurred'
  }
  const cells: VirtualDomNode[] = [
    { className: 'WorkersViewWorkerCell', role: AriaRoles.Cell, textContent: worker.name, type: VirtualDomElements.Td },
  ]
  if (showMemory) {
    cells.push(...getMemoryCell(worker))
  }
  return [
    {
      'aria-selected': selected,
      ariaLabel: worker.name,
      childCount: showMemory ? 2 : 1,
      className,
      'data-workerId': worker.id,
      onClick: DomEventListenerFunctions.SelectWorker,
      onContextMenu: DomEventListenerFunctions.ShowWorkerContextMenu,
      role: AriaRoles.Row,
      type: VirtualDomElements.Tr,
    },
    ...cells,
  ]
}
