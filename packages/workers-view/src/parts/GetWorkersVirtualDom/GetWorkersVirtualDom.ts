import { PlatformType } from '@lvce-editor/constants'
import { VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { DisplayedWorker } from '../WorkersState/WorkersState.ts'
import * as AriaRoles from '../AriaRoles/AriaRoles.ts'
import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'
import * as GetEmptyState from '../GetEmptyState/GetEmptyState.ts'
import * as GetWorkerRow from '../GetWorkerRow/GetWorkerRow.ts'
import * as TabIndex from '../TabIndex/TabIndex.ts'
import * as WorkersViewStrings from '../WorkersViewStrings/WorkersViewStrings.ts'

const getError = (error: Error | undefined): readonly VirtualDomNode[] =>
  error ? [{ className: 'WorkersViewError', role: AriaRoles.Alert, textContent: error.message, type: VirtualDomElements.P }] : []

const contextMenuContainer = { childCount: 1, className: 'WorkersViewContextMenu', type: VirtualDomElements.Div }

export const getWorkersVirtualDom = (
  workers: readonly DisplayedWorker[],
  loaded: boolean,
  platform: number,
  error: Error | undefined = undefined,
  strings: typeof WorkersViewStrings = WorkersViewStrings,
  sortColumn: 'memory' | 'name' | undefined = undefined,
  sortDirection: 'ascending' | 'descending' | undefined = undefined,
  selectedWorkerId: string | undefined = undefined,
  contextMenuWorkerId: string | undefined = undefined,
  hasFocus = false,
): readonly VirtualDomNode[] => {
  const showMemory = platform === PlatformType.Electron
  const getHeaderCell = (column: 'memory' | 'name', textContent: string, listener: number): VirtualDomNode[] => [
    {
      'aria-sort': sortColumn === column ? sortDirection : 'none',
      childCount: 1,
      className: 'WorkersViewTableHeaderCell',
      role: AriaRoles.ColumnHeader,
      type: VirtualDomElements.Th,
    },
    {
      className: 'WorkersViewTableHeaderButton',
      onClick: listener,
      textContent,
      type: VirtualDomElements.Button,
    },
  ]
  const headerCells = [
    getHeaderCell('name', strings.name(), DomEventListenerFunctions.SortByName),
    getHeaderCell('memory', strings.javaScriptHeapUsed(), DomEventListenerFunctions.SortByMemory),
  ]
  const headerRow = { childCount: headerCells.length, className: 'WorkersViewTableHeaderRow', role: AriaRoles.Row, type: VirtualDomElements.Tr }
  const title = { className: 'WorkersViewTitle', textContent: strings.workers(), type: VirtualDomElements.H1 }
  const columns = (showMemory ? headerCells : headerCells.slice(0, 1)).flat()
  const rows = workers.flatMap((worker) => GetWorkerRow.getWorkerRow(worker, showMemory, strings, worker.id === selectedWorkerId, hasFocus))
  const table = {
    ariaLabel: strings.workers(),
    childCount: workers.length + 1,
    className: 'WorkersViewTable',
    onFocus: DomEventListenerFunctions.FocusWorkers,
    onKeyDown: DomEventListenerFunctions.NavigateWorkers,
    role: AriaRoles.Table,
    tabIndex: TabIndex.Focusable,
    type: VirtualDomElements.Table,
  }
  const contextMenu = contextMenuWorkerId
    ? [
        contextMenuContainer,
        {
          className: 'WorkersViewContextMenuItem',
          'data-workerId': contextMenuWorkerId,
          onClick: DomEventListenerFunctions.TerminateWorker,
          textContent: strings.terminateWorker(),
          type: VirtualDomElements.Button,
        },
      ]
    : []
  const errorDom = getError(error)
  const emptyDom = GetEmptyState.getEmptyState(workers, loaded, strings)
  const children = [title, ...errorDom, table, { ...headerRow, childCount: showMemory ? 2 : 1 }, ...columns, ...rows, ...emptyDom, ...contextMenu]
  return [
    { childCount: 2 + errorDom.length + emptyDom.length + contextMenu.length, className: 'WorkersView', type: VirtualDomElements.Div },
    ...children,
  ]
}
