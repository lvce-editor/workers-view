# LVCE Editor Workers View

The Workers view lists active renderer workers and their display names. In Electron, it also shows each worker's JavaScript heap usage in bytes formatted as KiB or MiB. Web and remote sessions show names only.

The view refreshes automatically while open. Measurements that are unavailable because a worker closes or cannot be inspected are shown as `Unavailable`.

In Linux Electron, the CPU (%) column shows each worker thread's user and system CPU time over the last refresh interval. One fully occupied core is 100%, regardless of the machine's core count. CPU values can be sorted with the column header. The first sample, unsupported platforms, closed workers, or unavailable debugger measurements display `Unavailable`.

CPU attribution uses a brief Chromium trace when discovering new workers, followed by Linux thread counters on each refresh. An existing DevTools recording is never interrupted; reopening the view retries unavailable thread attribution after that recording has ended. Closing the view releases the measurement connection.
