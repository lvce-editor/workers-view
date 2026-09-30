import * as FormatMemory from '../FormatMemory/FormatMemory.ts'
import * as WorkersViewStrings from '../WorkersViewStrings/WorkersViewStrings.ts'

export const getMemoryText = (memory: number | null): string =>
  memory === null ? WorkersViewStrings.unavailable() : FormatMemory.formatMemory(memory)
