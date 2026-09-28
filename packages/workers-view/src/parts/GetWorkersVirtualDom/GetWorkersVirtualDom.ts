import { PlatformType } from '@lvce-editor/constants'
import { VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { DisplayedWorker } from '../WorkersState/WorkersState.ts'
import * as AriaRoles from '../AriaRoles/AriaRoles.ts'
import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'
import * as GetEmptyState from '../GetEmptyState/GetEmptyState.ts'
import * as GetWorkerRow from '../GetWorkerRow/GetWorkerRow.ts'
import * as WorkersViewStrings from '../WorkersViewStrings/WorkersViewStrings.ts'

const getError = (error: Error | undefined): readonly VirtualDomNode[] =>
  error ? [{ className: 'WorkersViewError', role: AriaRoles.Alert, textContent: error.message, type: VirtualDomElements.P }] : []

export const getWorkersVirtualDom = (
  workers: readonly DisplayedWorker[],
  loaded: boolean,
  platform: number,
  error: Error | undefined = undefined,
  strings: typeof WorkersViewStrings = WorkersViewStrings,
): readonly VirtualDomNode[] => {
  const showMemory = platform === PlatformType.Electron
  const headerCells = [
    { className: 'WorkersViewTableHeaderCell', role: AriaRoles.ColumnHeader, textContent: strings.name(), type: VirtualDomElements.Th },
    {
      className: 'WorkersViewTableHeaderCell',
      role: AriaRoles.ColumnHeader,
      textContent: strings.javaScriptHeapUsed(),
      type: VirtualDomElements.Th,
    },
  ]
  const headerRow = { childCount: headerCells.length, className: 'WorkersViewTableHeaderRow', role: AriaRoles.Row, type: VirtualDomElements.Tr }
  const title = { className: 'WorkersViewTitle', textContent: strings.workers(), type: VirtualDomElements.H1 }
  const refreshButton = {
    className: 'WorkersViewRefreshButton',
    onClick: DomEventListenerFunctions.Refresh,
    textContent: strings.refresh(),
    type: VirtualDomElements.Button,
  }
  const columns = showMemory ? headerCells : headerCells.slice(0, 1)
  const rows = workers.flatMap((worker) => GetWorkerRow.getWorkerRow(worker, showMemory, strings))
  const table = {
    ariaLabel: strings.workers(),
    childCount: workers.length + 1,
    className: 'WorkersViewTable',
    role: AriaRoles.Table,
    type: VirtualDomElements.Table,
  }
  const errorDom = getError(error)
  const emptyDom = GetEmptyState.getEmptyState(workers, loaded, strings)
  const children = [title, refreshButton, ...errorDom, table, { ...headerRow, childCount: columns.length }, ...columns, ...rows, ...emptyDom]
  return [{ childCount: 3 + errorDom.length + emptyDom.length, className: 'WorkersView', type: VirtualDomElements.Div }, ...children]
}
