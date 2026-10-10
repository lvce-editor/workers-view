export interface TrackedWorker {
  readonly id: string
  readonly name: string
  readonly parentId?: string
  readonly runtimeName: string
}

export interface DisplayedWorker extends TrackedWorker {
  readonly cpu?: number | null
  readonly memory: number | null
  readonly memoryTrend?: {
    readonly direction: 'growing' | 'shrinking'
    readonly bytesPerSecond: number
  }
}

export interface VisibleWorker extends DisplayedWorker {
  readonly depth: number
  readonly expanded: boolean
  readonly hasChildren: boolean
}

export interface MemorySample {
  readonly id: string
  readonly memory: number
  readonly timestamp: number
}

export type SortColumn = 'cpu' | 'memory' | 'name'
export type SortDirection = 'ascending' | 'descending'

export interface WorkersState {
  readonly collapsedWorkerIds?: readonly string[]
  readonly domRendered: boolean
  readonly error: Error | undefined
  readonly hasFocus: boolean
  readonly height: number
  readonly loaded: boolean
  readonly memorySamples?: readonly MemorySample[]
  readonly platform: number
  readonly scrollTop: number
  readonly selectedWorkerId: string | undefined
  readonly sortColumn: SortColumn | undefined
  readonly sortDirection: SortDirection | undefined
  readonly uid: number
  readonly width: number
  readonly workers: readonly DisplayedWorker[]
  readonly x: number
  readonly y: number
}
