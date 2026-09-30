export interface MenuEntry {
  readonly args: readonly unknown[]
  readonly command: string
  readonly flags: number
  readonly id: string
  readonly label: string
}
