import type * as WorkersViewStrings from '../WorkersViewStrings/WorkersViewStrings.ts'
import * as FormatMemory from '../FormatMemory/FormatMemory.ts'

export const getMemoryText = (memory: number | null, strings: typeof WorkersViewStrings): string =>
  memory === null ? strings.unavailable() : FormatMemory.formatMemory(memory)
