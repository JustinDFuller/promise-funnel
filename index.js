module.exports = function ({ Promise: Promise_ = Promise } = {}) {
  let corked = false
  let queue = []

  return {
    wrap (fn) {
      return function wrappedFunction (...options) {
        if (!corked) {
          return fn(...options)
        }

        return new Promise_(function (resolve, reject) {
          queue.push({ fn, resolve, reject, options })
        })
      }
    },
    cork () {
      corked = true
    },
    uncork () {
      corked = false
      queue.forEach(function ({ fn, resolve, reject, options }) {
        const res = fn(...options)

        if (res && res.then && res.catch) {
          return res.then(resolve).catch(reject)
        }

        return res
      })
      queue = []
    }
  }
}
