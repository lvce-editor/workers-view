import type { MenuItemFlags } from '@lvce-editor/constants'

export interface MenuEntry {
  readonly args: readonly unknown[]
  readonly command: string
  readonly flags: MenuItemFlags
  readonly id: string
  readonly label: string
}
