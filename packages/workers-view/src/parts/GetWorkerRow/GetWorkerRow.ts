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
        'data-contextMenuWorkerId': worker.id,
        role: AriaRoles.Cell,
        textContent: GetMemoryText.getMemoryText(worker.memory),
        type: VirtualDomElements.Td,
      },
    ]
  }
  const growing = worker.memoryTrend.direction === 'growing'
  const rate = FormatMemoryRate.formatMemoryRate(worker.memoryTrend.bytesPerSecond)
  const memoryChildren: VirtualDomNode[] = [
    {
      className: 'WorkersViewMemory',
      'data-contextMenuWorkerId': worker.id,
      textContent: GetMemoryText.getMemoryText(worker.memory),
      type: VirtualDomElements.Span,
    },
    {
      ariaLabel: growing ? WorkersViewStrings.memoryGrowing(rate) : WorkersViewStrings.memoryShrinking(rate),
      className: growing ? 'WorkersViewMemoryTrend WorkersViewMemoryTrendGrowing' : 'WorkersViewMemoryTrend WorkersViewMemoryTrendShrinking',
      'data-contextMenuWorkerId': worker.id,
      textContent: `${growing ? '↑' : '↓'} ${rate}`,
      type: VirtualDomElements.Span,
    },
  ]
  return [
    {
      childCount: memoryChildren.length,
      className: 'WorkersViewWorkerCell',
      'data-contextMenuWorkerId': worker.id,
      role: AriaRoles.Cell,
      type: VirtualDomElements.Td,
    },
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
    {
      className: 'WorkersViewWorkerCell',
      'data-contextMenuWorkerId': worker.id,
      role: AriaRoles.Cell,
      textContent: worker.name,
      type: VirtualDomElements.Td,
    },
  ]
  if (showMemory) {
    cells.push(...getMemoryCell(worker), {
      className: 'WorkersViewWorkerCell',
      'data-contextMenuWorkerId': worker.id,
      role: AriaRoles.Cell,
      textContent:
        typeof worker.cpu === 'number' && Number.isFinite(worker.cpu) && worker.cpu >= 0 && worker.cpu <= 100
          ? worker.cpu.toFixed(1)
          : WorkersViewStrings.unavailable(),
      type: VirtualDomElements.Td,
    })
  }
  return [
    {
      'aria-selected': selected,
      ariaLabel: worker.name,
      childCount: showMemory ? 3 : 1,
      className,
      'data-contextMenuWorkerId': worker.id,
      'data-workerId': worker.id,
      onClick: DomEventListenerFunctions.SelectWorker,
      role: AriaRoles.Row,
      type: VirtualDomElements.Tr,
    },
    ...cells,
  ]
}
