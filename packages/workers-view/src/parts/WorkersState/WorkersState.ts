export interface TrackedWorker {
  readonly id: string
  readonly name: string
  readonly runtimeName: string
}

export interface DisplayedWorker extends TrackedWorker {
  readonly memory: number | null
}

export type SortColumn = 'memory' | 'name'
export type SortDirection = 'ascending' | 'descending'

export interface WorkersState {
  readonly contextMenuWorkerId?: string | undefined
  readonly domRendered?: boolean
  readonly error: Error | undefined
  readonly hasFocus?: boolean | undefined
  readonly height: number
  readonly loaded: boolean
  readonly platform: number
  readonly selectedWorkerId?: string | undefined
  readonly sortColumn: SortColumn | undefined
  readonly sortDirection: SortDirection | undefined
  readonly uid: number
  readonly width: number
  readonly workers: readonly DisplayedWorker[]
}
