/**
 * Copyright (c) 2024   Loh Wah Kiang
 *
 * openGauss is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 * -------------------------------------------------------------------------
 */
"use strict";
/**
 * The submodule of helper
 * @module utils_helper_object
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [pathname, curdir] = args;
    try {
      let lib = {};

      /**
       * Return true where item is object
       * @alias module:object.isObject
       * @param {Object|Array|String} item - Any data type
       * @returns {Boolean}
       */
      const isObject = (item) => {
        return item && typeof item === "object" && !Array.isArray(item);
      };

      /**
       * Return object where option is the key, value is the value for the key
       * @alias module:object.insert2obj
       * @param {Array} option - Array of string for key.
       * @param {Array} value  - Array of value for the key that must be sequence as the option.
       * @returns {Object} - Object that has been assigned to the key and value.
       */
      lib.insert2obj = (option, value) => {
        let output = {};
        try {
          sysmodule.lodash.map(option, (val, id) => {
            output[val] = value[id];
          });

          return output;
        } catch (e) {
          return e;
        }
      };

      
      /**
       * The main objective is find the value base on nested keyname
       * The detail refer to https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
       * @alias module:object.mergeDeep
       * @param {Object} target - Target object to merge
       * * @param {...Object} sources - Source object to merge
       * @returns {Object} - Return merge value
       */
      lib.mergeDeep = (target, ...sources) => {
        if (!sources.length) return target;
        const source = sources.shift();

        if (isObject(target) && isObject(source)) {
          for (const key in source) {
            if (isObject(source[key])) {
              if (!target[key]) Object.assign(target, { [key]: {} });
              lib.mergeDeep(target[key], source[key]);
            } else {
              if (Array.isArray(target[key]) && Array.isArray(source[key])) {
                let concat = target[key].concat(source[key]);

                // Set will filter out duplicates automatically
                let data = [...new Set(concat)];
                target[key] = data;
              } else Object.assign(target, { [key]: source[key] });
            }
          }
        }
        return lib.mergeDeep(target, ...sources);
      };

      /**
       * The main objective is delete keys values pair by keys name
       * The detail refer to https://stackoverflow.com/questions/43011742/how-to-omit-specific-properties-from-an-object-in-javascript
       * @alias module:object.omit
       * @param {Object} object - Source data
       * * @param {String} keys - Add empty space between key and next key when need delete multiple keys
       * @returns {Object} - Return object
       */
      lib.omit = (object, keys) => {
        let rtn = object;
        keys.split(" ").map((val) => {
          const { [val]: omitted, ...rest } = rtn;
          rtn = rest;
        });
        return rtn;
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
