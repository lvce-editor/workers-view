import { mergeClassNames, VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { DisplayedWorker, VisibleWorker } from '../WorkersState/WorkersState.ts'
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

const getDisclosureButton = (worker: VisibleWorker): readonly VirtualDomNode[] => {
  if (!worker.hasChildren) return []
  return [
    {
      ariaLabel: worker.expanded ? WorkersViewStrings.collapseWorker() : WorkersViewStrings.expandWorker(),
      className: 'WorkersViewDisclosure',
      'data-workerId': worker.id,
      onClick: DomEventListenerFunctions.ToggleWorker,
      textContent: worker.expanded ? '▾' : '▸',
      type: VirtualDomElements.Button,
    },
  ]
}

const getRowClassName = (selected: boolean, hasFocus: boolean): string => {
  if (!selected) return 'WorkersViewWorkerRow'
  const focusClassName = hasFocus ? 'WorkersViewWorkerRowFocused' : 'WorkersViewWorkerRowBlurred'
  return mergeClassNames('WorkersViewWorkerRow', 'WorkersViewWorkerRowSelected', focusClassName)
}

export const getWorkerRow = (worker: VisibleWorker, showMemory: boolean, selected: boolean, hasFocus: boolean): readonly VirtualDomNode[] => {
  const className = getRowClassName(selected, hasFocus)
  const cells: VirtualDomNode[] = [
    {
      childCount: worker.hasChildren ? 2 : 1,
      className: mergeClassNames('WorkersViewWorkerCell', 'WorkersViewNameCell', `WorkersViewIndent-${worker.depth}`),
      'data-contextMenuWorkerId': worker.id,
      role: AriaRoles.Cell,
      type: VirtualDomElements.Td,
    },
    ...getDisclosureButton(worker),
    {
      className: 'WorkersViewWorkerName',
      'data-contextMenuWorkerId': worker.id,
      textContent: worker.name,
      type: VirtualDomElements.Span,
    },
  ]
  if (showMemory) {
    cells.push(...getMemoryCell(worker))
  }
  return [
    {
      'aria-selected': selected,
      ariaExpanded: worker.hasChildren ? worker.expanded : undefined,
      ariaLabel: worker.name,
      ariaLevel: worker.depth,
      childCount: showMemory ? 2 : 1,
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
