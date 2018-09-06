var fs = require('fs');
var storage = require('./cjs');

storage
  .getItem('nope')
  .then(function (value) {
    console.assert(value === null, 'unknown items return null');
    storage.setItem('yep', 123).then(function (value) {
      console.assert(value === 123, 'setItem pass along the value');
      storage
        .getItem('yep')
        .then(function (value) {
          console.assert(value === 123, 'setItem did save the value');
          storage.keys().then(function (keys) {
            console.assert(keys.length === 1, 'there is one key stored');
            console.assert(keys[0] === 'yep', 'the key is correct');
            storage.removeItem('yep').then(function () {
              storage
                .getItem('yep')
                .then(function (value) {
                  console.assert(value === null, 'removeItem dropped the key');
                  storage.length().then(function (value) {
                    console.assert(value === 0, 'the key is indeed removed');
                    fs.exists(storage.folder, function (result) {
                      console.assert(result, 'the folder is still there');
                      storage.setItem('any', 'value').then(function () {
                        storage.clear().then(function () {
                          fs.exists(storage.folder, function (result) {
                            console.assert(!result, 'the whole folder has been cleared');
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
