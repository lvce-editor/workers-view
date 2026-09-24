import * as AutoRefresh from '../AutoRefresh/AutoRefresh.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'

export const dispose = (uid: number): void => {
  AutoRefresh.dispose(uid)
  WorkersStates.dispose(uid)
}
