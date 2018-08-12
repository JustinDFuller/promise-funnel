# Funnel

## Installation

NPM Installation
```
npm install promise-funnel --save
```

Yard Installation
```
yarn add promise-funnel
```

## What
Funnel is a tiny library (4kb after babel) that will wrap your functions. Funnel provides a cork method that will temporarily stop any wrapped functions from being invoked. It also provides an uncork method that will invoke any methods that became queued up while the funnel was corked.

## Why
Sometimes you will have functions, for example an http request function, that needs to be paused and then resumed later. 

A common example of this could be a UI application that occasionally needs to re-authenticate. It would be best if normal requests did not fail while the initial or subsequent authentications are being negotiated.

Another example is a database connection. Your application may like to start up quickly and begin accepting requests even if the database isn't finished authenticating.

By _funneling_ requests you can wait for some event to finish, all of your functions waiting to be told to go ahead.

## Concepts

**Cork**: Don't allow functions to be invoked. Save them and remember their arguments.
**Uncork**: Invoke all functions that were saved with their original arguments.
**Wrap**: Wrap a function so that it can be corked and uncorked.

## Example

```js
import mysql from 'mysql'
import createFunnel from 'promise-funnel'

const funnel = createFunnel()
funnel.cork()

const connection = mysql.createConnection({
    /* options here */
})

connection.connect(function () {
    /**
     * At this point query will begin to be invoked immediately
     * And any queries that were queued up while waiting will be
     * invoked.
     */
    funnel.uncork()
})

/**
 * Immediately export and allow use of 
 * A "query" function without having to 
 * worry about it being invoked before the connection
 */
export default funnel.wrap(function query (queryString) {
  return new Promise((resolve, reject) => {
    connection.query(queryString, function (error, results) {
      if (error) return reject(error)
      return resolve(results)
    })
  })
})

```
