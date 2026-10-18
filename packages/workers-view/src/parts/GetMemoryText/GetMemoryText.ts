import * as FormatMemory from '../FormatMemory/FormatMemory.ts'
import * as WorkersViewStrings from '../WorkersViewStrings/WorkersViewStrings.ts'

export const getMemoryText = (memory: number | null, synthetic = false): string => {
  if (synthetic) return '0MB'
  if (memory === null) return WorkersViewStrings.unavailable()
  return FormatMemory.formatMemory(memory)
}
