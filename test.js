var fs = require('fs');
var storage = require('./cjs');
var invokes = [];

storage
  .getItem('nope', function (value) {
    invokes.push(value === null);
    return value;
  })
  .then(function (value) {
    console.assert(value === null, 'unknown items return null');
    storage.setItem('yep', 123, function (value) {
      invokes.push(value === 123);
      return value;
    }).then(function (value) {
      console.assert(value === 123, 'setItem pass along the value');
      storage
        .getItem('yep', function (value) {
          invokes.push(value === 123);
          return value;
        })
        .then(function (value) {
          console.assert(value === 123, 'setItem did save the value');
          storage.keys(function (keys) {
            invokes.push(keys.join(',') === 'yep');
            return keys;
          }).then(function (keys) {
            console.assert(keys.length === 1, 'there is one key stored');
            console.assert(keys[0] === 'yep', 'the key is correct');
            storage.removeItem('yep', function (value) {
              invokes.push(value === void 0);
            }).then(function () {
              storage
                .getItem('yep')
                .then(function (value) {
                  console.assert(value === null, 'removeItem dropped the key');
                  storage.length(function (value) {
                    invokes.push(value === 0);
                    return value;
                  }).then(function (value) {
                    console.assert(value === 0, 'the key is indeed removed');
                    fs.exists(storage.folder, function (result) {
                      console.assert(result, 'the folder is still there');
                      storage.setItem('any', 'value').then(function () {
                        storage.clear(function (value) {
                          invokes.push(value === void 0);
                        }).then(function () {
                          fs.exists(storage.folder, function (result) {
                            console.assert(!result, 'the whole folder has been cleared');
                            console.assert(
                              invokes.length === 7 &&
                              invokes.every(Boolean),
                              'all callbacks executed OK'
                            );
                          });
                        });
                      });
                    });
                  });
                });
            });
          });
        });
    });
  });
