const test = require('ava')

const promiseFunnel = require('./')

test('It exports a function', function (t) {
  t.is(typeof promiseFunnel, 'function')
})

test('Calling the function returns an object', function (t) {
  const funnel = promiseFunnel()
  t.is(typeof funnel, 'object')
})

test('The funnel provides a wrap method', function (t) {
  const { wrap } = promiseFunnel()
  t.is(typeof wrap, 'function')
})

test('Calling wrap on a function returns another function', function (t) {
  const testFunction = function () {}
  const { wrap } = promiseFunnel()
  const wrapped = wrap(testFunction)
  t.is(typeof wrapped, 'function')
})

test('With no other methods invoked, calling the wrapped function executes immediately', function (t) {
  const testFunction = function () {
    return 'done!'
  }
  const { wrap } = promiseFunnel()
  const wrapped = wrap(testFunction)
  t.is(wrapped(), 'done!')
})

test('The funnel provides a cork method', function (t) {
  const { cork } = promiseFunnel()
  t.is(typeof cork, 'function')
})

test('When cork is called with, all wrapped functions return a promise', function (t) {
  const testFunction = function () {
    return 'done!'
  }
  const { cork, wrap } = promiseFunnel()
  cork()
  const wrapped = wrap(testFunction)
  const result = wrapped()
  t.is(typeof result, 'object')
  t.is(typeof result.then, 'function')
  t.is(typeof result.catch, 'function')
})

test('The funnel provides an uncork method', function (t) {
  const { uncork } = promiseFunnel()
  t.is(typeof uncork, 'function')
})

test('Calling uncork executes all wrapped functions that were initiated AFTER a cork', function (t) {
  const { cork, uncork, wrap } = promiseFunnel()

  let fn1Called = false
  let fn2Called = false
  let fn3Called = false

  const fn1 = wrap(function () {
    fn1Called = true
  })
  const fn2 = wrap(function () {
    fn2Called = true
  })
  const fn3 = wrap(function () {
    fn3Called = true
  })

  t.is(fn1Called, false)
  t.is(fn2Called, false)
  t.is(fn3Called, false)

  fn1()

  t.is(fn1Called, true)
  t.is(fn2Called, false)
  t.is(fn3Called, false)

  cork()

  fn2()
  fn3()

  uncork()

  t.is(fn1Called, true)
  t.is(fn2Called, true)
  t.is(fn3Called, true)
})

test('When an async function is uncorked, the promise is resolved', function (t) {
  const { cork, uncork, wrap } = promiseFunnel()
  t.plan(1)

  const wrapped = wrap(function () {
    return new Promise(function (resolve) {
      return resolve('done!')
    })
  })

  cork()

  const promise = wrapped()

  uncork()

  return promise.then(function (res) {
    t.is(res, 'done!')
  })
})

test('When an async function is uncorked, rejections are caught', function (t) {
  const { cork, uncork, wrap } = promiseFunnel()
  t.plan(1)

  const wrapped = wrap(function () {
    return new Promise(function (resolve, reject) {
      return reject(new Error('done!'))
    })
  })

  cork()

  const promise = wrapped()

  uncork()

  return promise.catch(function (err) {
    t.is(err.message, 'done!')
  })
})

test('Uncorked methods remember their arguments', function (t) {
  const { cork, uncork, wrap } = promiseFunnel()

  let fn1Called = false
  let fn2Called = false
  let fn3Called = false

  const fn1 = wrap(function (wasCalled) {
    fn1Called = wasCalled
  })
  const fn2 = wrap(function (blank, wasCalled) {
    fn2Called = wasCalled
  })
  const fn3 = wrap(function (blank, blank2, wasCalled) {
    fn3Called = wasCalled
  })

  t.is(fn1Called, false)
  t.is(fn2Called, false)
  t.is(fn3Called, false)

  fn1(true)

  t.is(fn1Called, true)
  t.is(fn2Called, false)
  t.is(fn3Called, false)

  cork()

  fn2(false, true)
  fn3(false, false, true)

  uncork()

  t.is(fn1Called, true)
  t.is(fn2Called, true)
  t.is(fn3Called, true)
})

test('Async functions remember their arguments when uncorked', function (t) {
  const { cork, uncork, wrap } = promiseFunnel()
  t.plan(1)

  const wrapped = wrap(function (blank, done) {
    return new Promise(function (resolve) {
      return resolve(done)
    })
  })

  cork()

  const promise = wrapped(null, 'done!')

  uncork()

  return promise.then(function (res) {
    t.is(res, 'done!')
  })
})

test('Funnel accepts a Promise library to use', function (t) {
  const testFunction = function () {
    return 'done!'
  }

  class myFakePromise {
    isMyFakePromise () {
      return true
    }
  }

  const { cork, wrap } = promiseFunnel({
    Promise: myFakePromise
  })
  cork()
  const wrapped = wrap(testFunction)
  const result = wrapped()
  t.is(typeof result, 'object')
  t.not(typeof result.then, 'function')
  t.not(typeof result.catch, 'function')
  t.is(result.isMyFakePromise(), true)
})

test('After uncorking methods are invoked immediately again', function (t) {
  const { cork, uncork, wrap } = promiseFunnel()

  let fn1Called = false
  let fn2Called = false
  let fn3Called = false

  const fn1 = wrap(function () {
    fn1Called = true
  })
  const fn2 = wrap(function () {
    fn2Called = true
  })
  const fn3 = wrap(function () {
    fn3Called = true
  })

  t.is(fn1Called, false)
  t.is(fn2Called, false)
  t.is(fn3Called, false)

  fn1()

  t.is(fn1Called, true)
  t.is(fn2Called, false)
  t.is(fn3Called, false)

  cork()

  fn2()

  uncork()

  t.is(fn2Called, true)
  t.is(fn3Called, false)

  fn3()

  t.is(fn3Called, true)
})

test('Methods are removed from queue after each uncork', function (t) {
  const { cork, uncork, wrap } = promiseFunnel()

  let fn1Called = 0
  let fn2Called = 0
  let fn3Called = 0

  const fn1 = wrap(function () {
    fn1Called++
  })
  const fn2 = wrap(function () {
    fn2Called++
  })
  const fn3 = wrap(function () {
    fn3Called++
  })

  t.is(fn1Called, 0)
  t.is(fn2Called, 0)
  t.is(fn3Called, 0)

  fn1()

  t.is(fn1Called, 1)
  t.is(fn2Called, 0)
  t.is(fn3Called, 0)

  cork()

  fn2()
  fn3()

  uncork()
  uncork()

  t.is(fn1Called, 1)
  t.is(fn2Called, 1)
  t.is(fn3Called, 1)
})
