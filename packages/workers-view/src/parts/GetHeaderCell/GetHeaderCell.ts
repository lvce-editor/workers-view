import { VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import * as AriaRoles from '../AriaRoles/AriaRoles.ts'
import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'

export const getHeaderCell = (
  column: 'memory' | 'name',
  textContent: string,
  sortColumn: 'memory' | 'name' | undefined,
  sortDirection: 'ascending' | 'descending' | undefined,
): VirtualDomNode[] => [
  {
    'aria-sort': sortColumn === column ? sortDirection : 'none',
    childCount: 1,
    className: 'WorkersViewTableHeaderCell',
    role: AriaRoles.ColumnHeader,
    type: VirtualDomElements.Th,
  },
  {
    className: 'WorkersViewTableHeaderButton',
    'data-sortColumn': column,
    onKeyDown: DomEventListenerFunctions.SortHeaderByKeyboard,
    textContent,
    type: VirtualDomElements.Button,
  },
]
