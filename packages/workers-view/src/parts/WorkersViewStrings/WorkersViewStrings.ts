import * as I18nString from '../I18nString/I18nString.ts'
import * as UiStrings from '../UiStrings/UiStrings.ts'

export const workers = (): string => I18nString.i18nString(UiStrings.Workers)
export const name = (): string => I18nString.i18nString(UiStrings.Name)
export const heapUse = (): string => I18nString.i18nString(UiStrings.HeapUse)
export const unavailable = (): string => I18nString.i18nString(UiStrings.Unavailable)
export const noWorkersAreRunning = (): string => I18nString.i18nString(UiStrings.NoWorkersAreRunning)
export const terminateWorker = (): string => I18nString.i18nString(UiStrings.TerminateWorker)
export const takeHeapSnapshot = (): string => I18nString.i18nString(UiStrings.TakeHeapSnapshot)
export const memoryGrowing = (rate: string): string => `${I18nString.i18nString(UiStrings.MemoryGrowing)} ${rate}`
export const memoryShrinking = (rate: string): string => `${I18nString.i18nString(UiStrings.MemoryShrinking)} ${rate}`
export const cpuUsage = (): string => I18nString.i18nString(UiStrings.CpuUsage)
