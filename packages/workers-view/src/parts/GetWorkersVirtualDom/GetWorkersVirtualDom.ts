import { PlatformType } from '@lvce-editor/constants'
import { VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { DisplayedWorker } from '../WorkersState/WorkersState.ts'
import * as AriaRoles from '../AriaRoles/AriaRoles.ts'
import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'
import * as GetEmptyState from '../GetEmptyState/GetEmptyState.ts'
import * as GetHeaderCell from '../GetHeaderCell/GetHeaderCell.ts'
import * as GetVisibleWorkers from '../GetVisibleWorkers/GetVisibleWorkers.ts'
import * as GetWorkerRow from '../GetWorkerRow/GetWorkerRow.ts'
import * as TabIndex from '../TabIndex/TabIndex.ts'
import * as WorkersViewStrings from '../WorkersViewStrings/WorkersViewStrings.ts'

const getError = (error: Error | undefined): readonly VirtualDomNode[] =>
  error ? [{ className: 'WorkersViewError', role: AriaRoles.Alert, textContent: error.message, type: VirtualDomElements.P }] : []

export const getWorkersVirtualDom = (
  workers: readonly DisplayedWorker[],
  loaded: boolean,
  platform: number,
  error: Error | undefined = undefined,
  sortColumn: 'cpu' | 'memory' | 'name' | undefined = undefined,
  sortDirection: 'ascending' | 'descending' | undefined = undefined,
  selectedWorkerId: string | undefined = undefined,
  hasFocus = false,
  collapsedWorkerIds: readonly string[] = [],
): readonly VirtualDomNode[] => {
  const showMemory = platform === PlatformType.Electron
  const headerCells = [
    GetHeaderCell.getHeaderCell('name', WorkersViewStrings.name(), sortColumn, sortDirection),
    GetHeaderCell.getHeaderCell('memory', WorkersViewStrings.heapUse(), sortColumn, sortDirection),
  ]
  const headerRow = { childCount: showMemory ? 2 : 1, className: 'WorkersViewTableHeaderRow', role: AriaRoles.Row, type: VirtualDomElements.Tr }
  const columns = (showMemory ? headerCells : headerCells.slice(0, 1)).flat()
  const visibleWorkers = GetVisibleWorkers.getVisibleWorkers(workers, collapsedWorkerIds)
  const rows = visibleWorkers.flatMap((worker) => GetWorkerRow.getWorkerRow(worker, showMemory, worker.id === selectedWorkerId, hasFocus))
  const table = {
    ariaLabel: WorkersViewStrings.workers(),
    childCount: visibleWorkers.length + 1,
    className: 'WorkersViewTable',
    onBlur: DomEventListenerFunctions.BlurWorkers,
    onClick: DomEventListenerFunctions.TableClick,
    onContextMenu: DomEventListenerFunctions.ShowWorkerContextMenu,
    onFocus: DomEventListenerFunctions.FocusWorkers,
    role: AriaRoles.TreeGrid,
    tabIndex: TabIndex.Focusable,
    type: VirtualDomElements.Table,
  }
  const errorDom = getError(error)
  const emptyDom = GetEmptyState.getEmptyState(workers, loaded)
  const tableContainer = {
    childCount: 1 + emptyDom.length,
    className: 'WorkersViewTableContainer',
    onScroll: DomEventListenerFunctions.ScrollWorkers,
    type: VirtualDomElements.Div,
  }
  const children = [...errorDom, tableContainer, table, headerRow, ...columns, ...rows, ...emptyDom]
  return [{ childCount: 1 + errorDom.length, className: 'WorkersView', type: VirtualDomElements.Div }, ...children]
}
