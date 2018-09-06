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

// constants
var HOME = require('os').userInfo().homedir;

// native
var fs = require('fs');
var path = require('path');

// third parts
var mkdirp = require('mkdirp');

function Perseverant(options) {"use strict";
  if (!options) options = {};
  var folder = options.folder || path.join(HOME, '.perseverant');
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
              path.join(folder, asBase64(key)),
              function (err, buffer) {
                if (err) resolve(null);
                else resolve(self.serializer.parse(buffer));
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
              path.join(folder, asBase64(key)),
              self.serializer.stringify(value),
              after(resolve, reject, value)
            );
          });
        },
        callback
      );
    }},

    // .removeItem(key[, callback]):Promise
    removeItem:{value: function (key, callback) {
      return exec.call(
        this,
        function (folder) {
          return new Promise(function (resolve, reject) {
            fs.unlink(
              path.join(folder, asBase64(key)),
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
      return exec.call(
        this,
        function (folder) {
          return new Promise(function (resolve, reject) {
            fs.readdir(
              folder,
              function (err, files) {
                if (isError(err)) reject(err);
                else resolve(files.map(asKey));
              }
            );
          });
        },
        callback
      );
    }}
  }
);

function after(resolve, reject, value) {
  var args = arguments.length < 3 ? [] : [value];
  return function (err) {
    if (isError(err)) reject(err);
    else resolve.apply(null, args);
  };
}

function asBase64(key) {
  return Buffer.from(key).toString('base64');
}

function asKey(base64) {
  return Buffer.from(base64, 'base64').toString();
}

function error(err) {
  throw err;
}

function exec(oninit, callback) {
  return init
          .call(this)
          .then(oninit, error)
          .then(callback || noop, error);
}

function init() {
  var self = this;
  return self._init || (self._init = new Promise(
    function (resolve, reject) {
      fs.stat(self.folder, function (err, stat) {
        if (isError(err) || (stat && !stat.isDirectory())) reject(err);
        else if (err) mkdirp(self.folder, function (err) {
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
  return err && !/^(?:ENOTDIR|ENOENT)$/.test(err.code);
}

function noop(id) {
  return id;
}
export default new Perseverant({});
