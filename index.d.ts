interface Options {
  Promise: typeof Promise
}
interface Funnel {
  wrap: <T extends any[], R>(fn: (...args: T) => R | Promise<R>) => (...args: T) => R | Promise<R>
  cork: () => void
  uncork: () => void
}
export = (options?: Options) => Funnel
