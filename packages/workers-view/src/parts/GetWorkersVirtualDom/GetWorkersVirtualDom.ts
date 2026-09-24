import { PlatformType } from '@lvce-editor/constants'
import { VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { DisplayedWorker } from '../WorkersState/WorkersState.ts'
import * as AriaRoles from '../AriaRoles/AriaRoles.ts'
import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'
import * as FormatMemory from '../FormatMemory/FormatMemory.ts'

const headerCells = [
  { className: 'workers-view-table-header-cell', role: AriaRoles.ColumnHeader, text: 'Name', type: VirtualDomElements.Th },
  { className: 'workers-view-table-header-cell', role: AriaRoles.ColumnHeader, text: 'JavaScript heap used', type: VirtualDomElements.Th },
]

const headerRow = { childCount: headerCells.length, className: 'workers-view-table-header-row', role: AriaRoles.Row, type: VirtualDomElements.Tr }
const title = { childCount: 1, className: 'workers-view-title', text: 'Workers', type: VirtualDomElements.H1 }
const refreshButton = {
  childCount: 1,
  className: 'workers-view-refresh-button',
  onClick: DomEventListenerFunctions.Refresh,
  text: 'Refresh',
  type: VirtualDomElements.Button,
}

const getMemoryText = (memory: number | null): string => (memory === null ? 'Unavailable' : FormatMemory.formatMemory(memory))

const getWorkerRow = (worker: DisplayedWorker, showMemory: boolean): readonly VirtualDomNode[] => {
  const cells: VirtualDomNode[] = [{ className: 'workers-view-worker-cell', role: AriaRoles.Cell, text: worker.name, type: VirtualDomElements.Td }]
  if (showMemory) {
    cells.push({ className: 'workers-view-worker-cell', role: AriaRoles.Cell, text: getMemoryText(worker.memory), type: VirtualDomElements.Td })
  }
  return [{ ariaLabel: worker.name, childCount: cells.length, className: 'workers-view-worker-row', role: AriaRoles.Row, type: VirtualDomElements.Tr }, ...cells]
}

const getEmptyState = (workers: readonly DisplayedWorker[], loaded: boolean): readonly VirtualDomNode[] => {
  if (workers.length > 0 || !loaded) return []
  return [{ className: 'workers-view-empty-state', role: AriaRoles.Status, text: 'No workers are running.', type: VirtualDomElements.P }]
}

export const getWorkersVirtualDom = (workers: readonly DisplayedWorker[], loaded: boolean, platform: number): readonly VirtualDomNode[] => {
  const showMemory = platform === PlatformType.Electron
  const columns = showMemory ? headerCells : headerCells.slice(0, 1)
  const rows = workers.flatMap((worker) => getWorkerRow(worker, showMemory))
  const table = {
    ariaLabel: 'Workers',
    className: 'workers-view-table',
    childCount: workers.length + 1,
    role: AriaRoles.Table,
    type: VirtualDomElements.Table,
  }
  const children = [title, refreshButton, table, { ...headerRow, childCount: columns.length }, ...columns, ...rows, ...getEmptyState(workers, loaded)]
  return [{ childCount: children.length, className: 'workers-view', type: VirtualDomElements.Div }, ...children]
}
