import * as ViewletRegistry from '@lvce-editor/viewlet-registry'
import type { WorkersState } from '../WorkersState/WorkersState.ts'

export const { dispose, get, getCommandIds, registerCommands, set, wrapCommand } = ViewletRegistry.create<WorkersState>()
