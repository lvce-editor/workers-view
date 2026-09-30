import { RendererWorker } from '@lvce-editor/rpc-registry'

export const show2 = async (uid: number, menuId: number, x: number, y: number, args: { readonly workerId: string }): Promise<void> => {
  await RendererWorker.showContextMenu2(uid, menuId, x, y, args)
}
