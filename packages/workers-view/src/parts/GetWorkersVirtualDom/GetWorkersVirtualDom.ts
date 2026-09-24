import { PlatformType } from '@lvce-editor/constants'
import { VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { DisplayedWorker } from '../WorkersState/WorkersState.ts'
import * as AriaRoles from '../AriaRoles/AriaRoles.ts'
import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'
import * as FormatMemory from '../FormatMemory/FormatMemory.ts'
import * as WorkersViewStrings from '../WorkersViewStrings/WorkersViewStrings.ts'

const getMemoryText = (memory: number | null): string => (memory === null ? WorkersViewStrings.unavailable() : FormatMemory.formatMemory(memory))

const getWorkerRow = (worker: DisplayedWorker, showMemory: boolean): readonly VirtualDomNode[] => {
  const cells: VirtualDomNode[] = [{ className: 'workers-view-worker-cell', role: AriaRoles.Cell, text: worker.name, type: VirtualDomElements.Td }]
  if (showMemory) {
    cells.push({ className: 'workers-view-worker-cell', role: AriaRoles.Cell, text: getMemoryText(worker.memory), type: VirtualDomElements.Td })
  }
  return [
    { ariaLabel: worker.name, childCount: cells.length, className: 'workers-view-worker-row', role: AriaRoles.Row, type: VirtualDomElements.Tr },
    ...cells,
  ]
}

const getEmptyState = (workers: readonly DisplayedWorker[], loaded: boolean): readonly VirtualDomNode[] => {
  if (workers.length > 0 || !loaded) return []
  return [
    { className: 'workers-view-empty-state', role: AriaRoles.Status, text: WorkersViewStrings.noWorkersAreRunning(), type: VirtualDomElements.P },
  ]
}

export const getWorkersVirtualDom = (workers: readonly DisplayedWorker[], loaded: boolean, platform: number): readonly VirtualDomNode[] => {
  const showMemory = platform === PlatformType.Electron
  const headerCells = [
    { className: 'workers-view-table-header-cell', role: AriaRoles.ColumnHeader, text: WorkersViewStrings.name(), type: VirtualDomElements.Th },
    {
      className: 'workers-view-table-header-cell',
      role: AriaRoles.ColumnHeader,
      text: WorkersViewStrings.javaScriptHeapUsed(),
      type: VirtualDomElements.Th,
    },
  ]
  const headerRow = { childCount: headerCells.length, className: 'workers-view-table-header-row', role: AriaRoles.Row, type: VirtualDomElements.Tr }
  const title = { childCount: 1, className: 'workers-view-title', text: WorkersViewStrings.workers(), type: VirtualDomElements.H1 }
  const refreshButton = {
    childCount: 1,
    className: 'workers-view-refresh-button',
    onClick: DomEventListenerFunctions.Refresh,
    text: WorkersViewStrings.refresh(),
    type: VirtualDomElements.Button,
  }
  const columns = showMemory ? headerCells : headerCells.slice(0, 1)
  const rows = workers.flatMap((worker) => getWorkerRow(worker, showMemory))
  const table = {
    ariaLabel: WorkersViewStrings.workers(),
    childCount: workers.length + 1,
    className: 'workers-view-table',
    role: AriaRoles.Table,
    type: VirtualDomElements.Table,
  }
  const children = [title, refreshButton, table, { ...headerRow, childCount: columns.length }, ...columns, ...rows, ...getEmptyState(workers, loaded)]
  return [{ childCount: children.length, className: 'workers-view', type: VirtualDomElements.Div }, ...children]
}
