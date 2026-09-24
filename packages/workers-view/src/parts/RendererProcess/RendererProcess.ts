import type { Rpc } from '@lvce-editor/rpc'
import { RendererProcess as RendererProcessRegistry } from '@lvce-editor/rpc-registry'

export const invoke = (method: string, ...params: readonly unknown[]): Promise<any> => RendererProcessRegistry.invoke(method, ...params)
export const set = (rpc: Rpc): void => RendererProcessRegistry.set(rpc)
