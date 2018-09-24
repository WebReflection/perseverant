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

'use strict';

// native
var fs = require('fs');
var os = require('os');
var path = require('path');
var crypto, ciphers;

/* istanbul ignore next */
try {
  crypto = require('crypto');
  ciphers = crypto.getCiphers();
} catch(NOENCRIPTION) {
  ciphers = [];
}

// constants
var HOME =  process.env.XDG_CONFIG_HOME ||
            path.join(
              os.homedir() ||
              /* istanbul ignore next */
              os.tmpdir(),
              '.config'
            );

// third parts
var mkdirp = require('mkdirp');

// provates
var encrypted = new WeakMap;

function Perseverant(options) {'use strict';
  if (!options) options = {};
  if (options.password != null) {
    /* istanbul ignore if */
    if (ciphers.indexOf(options.cipher || 'aes256') < 0)
      throw new Error('Invalid cipher: ' + options.cipher);
    encrypted.set(this, {
      password: String(options.password),
      cipher: options.cipher || 'aes256'
    });
    this.encrypted = true;
  }
  var folder = options.folder || path.join(HOME, 'perseverant');
  this.serializer = options.serializer || JSON;
  this.name = options.name || 'global';
  if (!/^[a-z0-9_-]+$/i.test(this.name))
    throw new Error('Invalid storage name: ' + this.name);
  this.folder = path.join(
    path.isAbsolute(folder) ? folder : path.join(process.cwd(), folder),
    this.name
  );
  this._init = null;
}

Object.defineProperties(
  Perseverant.prototype,
  {
    // .createInstance('name'):Perseverant
    // .createInstance({name, folder, serializer}):Perseverant
    createInstance: {value: function (options) {
      return new Perseverant(
        typeof options === 'string' ? {name: options} : options
      );
    }},

    // .getItem(key[, callback]):Promise(value)
    getItem:{value: function (key, callback) {
      var self = this;
      return exec.call(
        self,
        function (folder) {
          return new Promise(function (resolve) {
            fs.readFile(
              path.join(
                folder,
                self.encrypted ? encrypt(self, key) : asBase64(key)
              ),
              function (err, buffer) {
                if (err)
                  resolve(null);
                else
                  resolve(
                    self.serializer.parse(
                      self.encrypted ?
                        decrypt(self, buffer) :
                        buffer
                    )
                  );
              }
            );
          });
        },
        callback
      );
    }},

    // .setItem(key, value[, callback]):Promise(value)
    setItem:{value: function (key, value, callback) {
      var self = this;
      return exec.call(
        self,
        function (folder) {
          return new Promise(function (resolve, reject) {
            fs.writeFile(
              path.join(
                folder,
                self.encrypted ? encrypt(self, key) : asBase64(key)
              ),
              self.encrypted ?
                encrypt(self, self.serializer.stringify(value)) :
                self.serializer.stringify(value)
              ,
              function (err) {
                /* istanbul ignore if */
                if (err) reject(err);
                else resolve(value);
              }
            );
          });
        },
        callback
      );
    }},

    // .removeItem(key[, callback]):Promise
    removeItem:{value: function (key, callback) {
      var self = this;
      return exec.call(
        self,
        function (folder) {
          return new Promise(function (resolve, reject) {
            fs.unlink(
              path.join(
                folder,
                self.encrypted ? encrypt(self, key) : asBase64(key)
              ),
              after(resolve, reject)
            );
          });
        },
        callback
      );
    }},

    // .clear([callback]):Promise
    clear:{value: function (callback) {
      var self = this;
      return exec.call(
        self,
        function (folder) {
          return self.keys().then(function (keys) {
            return Promise.all(keys.map(function (key) {
              return self.removeItem(key);
            }));
          })
          .then(
            function () {
              return new Promise(function (resolve, reject) {
                fs.rmdir(folder, after(resolve, reject));
              });
            },
            error
          );
        },
        callback
      );
    }},

    // .length([callback]):Promise(length)
    length:{value: function (callback) {
      return this.keys().then(
        function (keys) {
          var length = keys.length;
          (callback || noop)(length);
          return length;
        } ,
        error
      );
    }},

    // .keys([callback]):Promise(keys)
    keys:{value: function (callback) {
      var self = this;
      return exec.call(
        self,
        function (folder) {
          return new Promise(function (resolve, reject) {
            fs.readdir(
              folder,
              function (err, files) {
                /* istanbul ignore if */
                if (err) reject(err);
                else resolve(files.map(asKey, self));
              }
            );
          });
        },
        callback
      );
    }}
  }
);

function after(resolve, reject) {
  return function (err) {
    /* istanbul ignore if */
    if (isError(err)) reject(err);
    else resolve();
  };
}

function asBase64(key) {
  return Buffer.from(key).toString('base64');
}

function asKey(fileName) {
  return this.encrypted ?
          decrypt(this, fileName) :
          Buffer.from(fileName, 'base64').toString();
}

function decrypt(self, buffer) {
  var info = encrypted.get(self);
  var decipher = crypto.createDecipher(info.cipher, info.password);
  return (decipher.update(String(buffer), 'hex', 'utf8') +
          decipher.final('utf8'));
}

function encrypt(self, buffer) {
  var info = encrypted.get(self);
  var cipher = crypto.createCipher(info.cipher, info.password);
  return (cipher.update(buffer, 'utf8', 'hex') +
          cipher.final('hex'));
}

function error(err) {
  throw err;
}

function exec(oninit, callback) {
  return init
          .call(this)
          .then(oninit)
          .then(callback || noop)
          .catch(error);
}

function init() {
  var self = this;
  return self._init || (self._init = new Promise(
    function (resolve, reject) {
      fs.stat(self.folder, function (err, stat) {
        if (isError(err) || (stat && !stat.isDirectory()))
          reject(err || new Error('Invalid folder: ' + self.folder));
        else if (err) mkdirp(self.folder, function (err) {
          /* istanbul ignore if */
          if (err) reject(err);
          else {
            self._init = null;
            resolve(self.folder);
          }
        });
        else {
          self._init = null;
          resolve(self.folder);
        }
      });
    }
  ));
}

function isError(err) {
  return !!err && !/^(?:ENOTDIR|ENOENT)$/.test(err.code);
}

function noop(id) {
  return id;
}
module.exports = new Perseverant({});
