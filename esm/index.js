/*!
 * ISC License
 *
 * Copyright (c) 2018, Andrea Giammarchi, @WebReflection
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

import {mkdir, readdir, readFile, rmdir, stat, unlink, writeFile} from 'fs';
import {homedir, tmpdir} from 'os';
import {cwd, env} from 'process';
import {isAbsolute, join} from 'path';

import Secretly from 'secretly';

// constants
const HOME =  env.XDG_CONFIG_HOME ||
              join(
                homedir() ||
                /* istanbul ignore next */
                tmpdir(),
                '.config'
              );

// helpers
const after = (resolve, reject) => err => {
  /* istanbul ignore if */
  if (isError(err)) reject(err);
  else resolve();
};
const asBase64 = key => Buffer.from(key).toString('base64');
const decrypt = (self, buffer) => encrypted.get(self).decrypt(buffer);
const encrypt = (self, buffer) => encrypted.get(self).encrypt(buffer);
const error = err => { throw err; };
const isError = err => (!!err && !/^(?:ENOTDIR|ENOENT)$/.test(err.code));
const noop = id => id;

// privates
const encrypted = new WeakMap;

class Perseverant {
  constructor(options = {}) {
    if (options.password) {
      encrypted.set(
        this,
        new Secretly(
          options.password,
          options.salt || 'perseverant',
          false
        )
      );
      this.encrypted = true;
    }
    const folder = options.folder || join(HOME, 'perseverant');
    this.serializer = options.serializer || JSON;
    this.name = options.name || 'global';
    if (!/^[a-z0-9_-]+$/i.test(this.name))
      throw new Error('Invalid storage name: ' + this.name);
    this.folder = join(
      isAbsolute(folder) ? folder : join(cwd(), folder),
      this.name
    );
    this._init = null;
  }

  // .createInstance('name'):Perseverant
  // .createInstance({name, folder, serializer}):Perseverant
  createInstance(options) {
    return new Perseverant(
      typeof options === 'string' ? {name: options} : options
    );
  }

  // .getItem(key[, callback]):Promise(value)
  getItem(key, callback) {
    return exec.call(
      this,
      folder => new Promise(resolve => {
        readFile(
          join(
            folder,
            this.encrypted ? encrypt(this, key) : asBase64(key)
          ),
          (err, buffer) => {
            if (err)
              resolve(null);
            else
              resolve(
                this.serializer.parse(
                  this.encrypted ?
                    decrypt(this, buffer) :
                    buffer
                )
              );
          }
        );
      }),
      callback
    );
  }

  // .setItem(key, value[, callback]):Promise(value)
  setItem(key, value, callback) {
    return exec.call(
      this,
      folder => new Promise((resolve, reject) => {
        writeFile(
          join(
            folder,
            this.encrypted ? encrypt(this, key) : asBase64(key)
          ),
          this.encrypted ?
            encrypt(this, this.serializer.stringify(value)) :
            this.serializer.stringify(value)
          ,
          err => {
            /* istanbul ignore if */
            if (err) reject(err);
            else resolve(value);
          }
        );
      }),
      callback
    );
  }

  // .removeItem(key[, callback]):Promise
  removeItem(key, callback) {
    return exec.call(
      this,
      folder => new Promise((resolve, reject) => {
        unlink(
          join(
            folder,
            this.encrypted ? encrypt(this, key) : asBase64(key)
          ),
          after(resolve, reject)
        );
      }),
      callback
    );
  }

  // .clear([callback]):Promise
  clear(callback) {
    return exec.call(
      this,
      folder => this.keys().then(
        keys => Promise.all(keys.map(key => this.removeItem(key)))
      )
      .then(
        () => new Promise((resolve, reject) => {
          rmdir(folder, after(resolve, reject));
        }),
        error
      ),
      callback
    );
  }

  // .length([callback]):Promise(length)
  length(callback) {
    return this.keys().then(
      ({length}) => {
        (callback || noop)(length);
        return length;
      },
      error
    );
  }

  // .keys([callback]):Promise(keys)
  keys(callback) {
    return exec.call(
      this,
      folder => new Promise((resolve, reject) => {
        readdir(
          folder,
          (err, files) => {
            /* istanbul ignore if */
            if (err) reject(err);
            else resolve(files.map(asKey, this));
          }
        );
      }),
      callback
    );
  }
}

function asKey(fileName) {
  return this.encrypted ?
          decrypt(this, fileName) :
          Buffer.from(fileName, 'base64').toString();
}

function exec(onInit, callback) {
  return init
          .call(this)
          .then(onInit)
          .then(callback || noop)
          .catch(error);
}

function init() {
  const self = this;
  const {folder} = self;
  return self._init || (self._init = new Promise(
    (resolve, reject) => {
      stat(folder, (err, stat) => {
        if (isError(err) || (stat && !stat.isDirectory()))
          reject(err || new Error('Invalid folder: ' + folder));
        else if (err)
          mkdir(folder, {recursive: true}, (err) => {
            /* istanbul ignore if */
            if (err) reject(err);
            else {
              self._init = null;
              resolve(folder);
            }
          });
        else {
          self._init = null;
          resolve(folder);
        }
      });
    }
  ));
}

export default new Perseverant;
