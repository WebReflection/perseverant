# Perseverant [![Build Status](https://travis-ci.com/WebReflection/perseverant.svg?branch=master)](https://travis-ci.com/WebReflection/perseverant) [![Coverage Status](https://coveralls.io/repos/github/WebReflection/perseverant/badge.svg?branch=master)](https://coveralls.io/github/WebReflection/perseverant?branch=master) [![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

An asynchronous, persistent, [localForage](https://github.com/localForage/localForage) inspired, filesystem based storage solution for NodeJS.


### Concept

Each key will be stored as regular file with serialized data.

By default, everything is kept super simple so whatever value will be saved as JSON.

It is possible to create a new instance with a different name, folder, or serializer.


### API

Following the **meta description** of the API.

```js
const perseverant = require('perseverant');
// or import perseverant from 'perseverant';

// by default, the name of the storage is 'global' but
// it is highly suggested to use your own project name instead
const storage = perseverant.createInstance('my-project'):Perseverant

// or ...
const storage = perseverant.createInstance({
  name,       // by default 'global'
  folder,     // by default $HOME/.config/perseverant
  serializer  // by default JSON
}):Perseverant

// retrieve a key (read key file)
storage.getItem(
  key
  [,callback(value || null)]
):Promise<value || null>

// store a key (write key file)
storage.setItem(
  key,
  value
  [, callback(value)]
):Promise<value>

// remove a key (unlink key file)
storage.removeItem(
  key
  [, callback]
):Promise

// clear all keys for the named storage (rm -rf folder and its files)
// WARNING: if you call this on global name, it'll clean it all
storage.clear([callback]):Promise

// returns the length of keys, from 0 to N
storage.length([callback(length)]):Promise<length>

// returns all keys
storage.keys([callback(keys[])]):Promise<keys[]>
```

### Things to consider

This project is not a database replacement, neither a secure way to store credentials, passwords, or any relevant data.

By default, everything is indeed stored as plain JSON, and in a location any other software can reach.

The goal of this project is to provide, specially to NodeJS CLI, a way to persist data in any kind of device.


### Technically speaking

  * each key is converted into its _base64_ counterpart, and its value stored via `JSON.stringify`
  * if you provide your own `serializer`, you could even encrypt data while storing, but that's up to you, nothing provided by default.
  * if you provide your own `serializer`, you can also store [recursive data](https://github.com/WebReflection/flatted#flatted) or buffers and binaries, currently not supported in core (to keep it simple) 

