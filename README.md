# Perseverant [![Build Status](https://travis-ci.com/WebReflection/perseverant.svg?branch=master)](https://travis-ci.com/WebReflection/perseverant) [![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

An asynchronous, persistent, [localForage](https://github.com/localForage/localForage) inspired, filesystem based storage solution for NodeJS.


### Concept

Each key will be stored as regular file with serialized data.

By default, everything is kept super simple so whatever value will be saved as JSON.

It is possible to create a new instance with a different serializer, folder, or name.


### API

This is the meta description of the API.

```js
const perseverant = require('perseverant');
// or import perseverant from 'perseverant';

// by default, the name of the storage is 'global' but
// it is highly suggested to use your own project name instead
const storage = perseverant.createInstance('my-project'):Perseverant
const storage = perseverant.createInstance({
  name,       // by default 'global'
  folder,     // by default HOME/.perseverant
  serializer  // by default JSON
}):Perseverant

// retrieve a key (read key file)
storage.getItem(key[, callback]):Promise(value || null)

// store a key (write key file)
storage.setItem(key, value[, callback]):Promise(value)

// remove a key (unlink key file)
storage.removeItem(key[, callback]):Promise

// clear all keys for the named storage (rm -rf folder and its files)
// WARNING: if you call this on global name, it'll clean it all
storage.clear([callback]):Promise

// returns the length of keys
storage.length([callback]):Promise(length)

// returns all keys
storage.keys([callback]):Promise(keys)
```
