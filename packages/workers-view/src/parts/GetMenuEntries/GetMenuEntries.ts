import { MenuItemFlags, PlatformType } from '@lvce-editor/constants'
import type { MenuEntry } from '../MenuEntry/MenuEntry.ts'
import type { WorkersState } from '../WorkersState/WorkersState.ts'
import * as WorkersStates from '../WorkersStates/WorkersStates.ts'
import * as WorkersViewStrings from '../WorkersViewStrings/WorkersViewStrings.ts'

export const getMenuEntriesForUid = (uid: number, args: { readonly workerId: string }): readonly MenuEntry[] => {
  const { newState } = WorkersStates.get(uid)
  return getMenuEntries(newState, args.workerId)
}

export const getMenuEntries = (state: WorkersState, workerId: string): readonly MenuEntry[] => {
  const { platform, workers } = state
  if (workers.every((worker) => worker.id !== workerId)) return []
  const entries: MenuEntry[] = [
    {
      args: [workerId],
      command: 'Workers.terminateWorker',
      flags: MenuItemFlags.None,
      id: 'terminateWorker',
      label: WorkersViewStrings.terminateWorker(),
    },
  ]
  if (platform === PlatformType.Electron) {
    entries.push({
      args: [workerId],
      command: 'Workers.takeHeapSnapshot',
      flags: MenuItemFlags.None,
      id: 'takeHeapSnapshot',
      label: WorkersViewStrings.takeHeapSnapshot(),
    })
  }
  return entries
}
