export interface TrackedWorker {
  readonly id: string
  readonly name: string
  readonly runtimeName: string
}

export interface DisplayedWorker extends TrackedWorker {
  readonly memory: number | null
}

export interface WorkersState {
  readonly error: Error | undefined
  readonly height: number
  readonly loaded: boolean
  readonly platform: number
  readonly uid: number
  readonly width: number
  readonly workers: readonly DisplayedWorker[]
}
