import * as AutoRefresh from '../AutoRefresh/AutoRefresh.ts'
import * as ViewLifetime from '../ViewLifetime/ViewLifetime.ts'
import * as WorkerMemory from '../WorkerMemory/WorkerMemory.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const dispose = (uid: number): void => {
  ViewLifetime.dispose(uid)
  AutoRefresh.dispose(uid)
  WorkerMemory.dispose(uid)
  WorkersStates.dispose(uid)
}
