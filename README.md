# LVCE Editor Workers View

The Workers view lists active renderer workers and their display names. In Electron, it also shows each worker's JavaScript heap usage in bytes formatted as KiB or MiB. Web and remote sessions show names only.

The view refreshes automatically while open. Measurements that are unavailable because a worker closes or cannot be inspected are shown as `Unavailable`.
