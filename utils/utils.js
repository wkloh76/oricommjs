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
 * The submodule utils module
 * @module utils_utils
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [pathname, curdir] = args;
    const { fs, path, jptr } = sysmodule;
    try {
      let lib = {};

      /**
       * Get the data type
       * @alias module:utils.datatype
       * @param {string| number| boolean| Object| Array} value - Determine the data type of the parameter
       * @returns {string}
       */
      lib["datatype"] = (value) => {
        try {
          let output = typeof value;
          if (output == "string") {
            if (!isNaN(value)) output = "number";
          } else if (output == "object") {
            if (Array.isArray(value)) {
              output = "array";
            } else if (Object.keys(value).length > 0) {
              output = "object";
            }
          }
          return output;
        } catch (e) {
          return e;
        }
      };

      /**
       * The main objective is find the value base on nested keyname
       * The detail refer to https://github.com/flexdinesh/typy
       * @alias module:utils.dir_module
       * @param {...Array} args - 2 parameters
       * @param {String} args[0] - pathname the folder path
       * @param {Array} args[1] - excludefile values from coresetting.general.excludefile
       * @param {Object} obj - Object
       * @param {String} dotSeparatedKeys - Nested keyname
       * @returns {Object} - Return modules | undefined
       */
      lib["dir_module"] = (...args) => {
        const [pathname, excluded] = args;
        return fs.readdirSync(path.join(pathname)).filter((filename) => {
          if (path.extname(filename) == "" && !excluded.includes(filename)) {
            return filename;
          }
        });
      };

      /**
       * The main objective base on list dynamic import commonJS modules
       * The detail refer to https://github.com/flexdinesh/typy
       * @alias module:utils.import_cjs
       * @param {...Array} args - 2 parameters
       * @param {Array} args[0] - list 3 set of values with pathname, arr_modname, curdir
       * @param {Object} args[1] - obj a set of object with kernel.utils
       * @returns {Object} - Return modules | undefined
       */
      lib["import_cjs"] = (...args) => {
        return new Promise(async (resolve, reject) => {
          const [list, obj] = args;
          const [pathname, arr_modname, curdir] = list;
          const { errhandler } = obj;
          const { join } = path;
          try {
            let modules = {};
            let arr_process = [],
              arr_name = [];
            for (let val of arr_modname) {
              let modpath = join(pathname, val);
              if (fs.readdirSync(modpath).length > 0) {
                let module = require(join(modpath), "utf8")(
                  [modpath, val, curdir],
                  [kernel, sysmodule, coresetting]
                );
                arr_name.push(val);
                arr_process.push(module);
              }
            }
            let arrrtn = await Promise.all(arr_process);
            for (let [idx, val] of Object.entries(arrrtn))
              modules[arr_name[idx]] = val;
            resolve(modules);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      };

      /**
       * The main objective base on list dynamic import ES modules
       * The detail refer to https://github.com/flexdinesh/typy
       * @alias module:utils.import_mjs
       * @param {...Array} args - 2 parameters
       * @param {Array} args[0] - list 3 set of values with pathname, arr_modname, curdir
       * @param {Object} args[1] - obj a set of object with kernel.utils
       * @returns {Object} - Return modules | undefined
       */
      lib["import_mjs"] = async (...args) => {
        return new Promise(async (resolve, reject) => {
          const [list, obj] = args;
          const [pathname, arr_modname, curdir] = list;
          const { errhandler } = obj;
          const { join } = path;
          try {
            let modules = {};
            let arr_process = [],
              arr_name = [];
            for (let val of arr_modname) {
              let modpath = join(pathname, val);
              if (fs.readdirSync(modpath).length > 0) {
                let module = require(join(modpath), "utf8")(
                  [modpath, val, curdir],
                  [kernel, sysmodule, coresetting]
                );
                arr_name.push(val);
                arr_process.push(module);
              }
            }
            let arrrtn = await Promise.all(arr_process);
            for (let [idx, val] of Object.entries(arrrtn)) {
              let { default: bare, ...value } = val;
              modules[arr_name[idx]] = { ...value, ...bare };
            }
            resolve(modules);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      };

      /**
       * The main objective is find the value base on nested keyname
       * The detail refer to https://github.com/flexdinesh/typy
       * @alias module:utils.getNestedObject
       * @param {Object} obj - Object
       * @param {String} dotSeparatedKeys - Nested keyname
       * @returns {Object} - Return modules | undefined
       */
      lib["getNestedObject"] = (obj, dotSeparatedKeys) => {
        if (
          dotSeparatedKeys !== undefined &&
          typeof dotSeparatedKeys !== "string"
        )
          return undefined;
        if (
          typeof obj !== "undefined" &&
          typeof dotSeparatedKeys === "string"
        ) {
          // split on ".", "[", "]", "'", """ and filter out empty elements
          const splitRegex = /[.\[\]'"]/g; // eslint-disable-line no-useless-escape
          const pathArr = dotSeparatedKeys
            .split(splitRegex)
            .filter((k) => k !== "");
          // eslint-disable-next-line no-param-reassign, no-confusing-arrow
          obj = pathArr.reduce(
            (o, key) => (o && o[key] !== "undefined" ? o[key] : undefined),
            obj
          );
        }
        return obj;
      };

      /**
       * Update object value by keyname
       * The detail refer to https://stackoverflow.com/questions/73071777/function-to-update-any-value-by-key-in-nested-object
       * @alias module:utils.updateObject
       *  @param {String} key - keyname
       * @param {Array|Object|String|Integer} newValue - Value support all data type
       * @param {Object} obj - Object
       * @returns {Object} - Return modules | undefined
       */
      lib["updateObject"] = (key, newValue, obj) => {
        let newObj = Object.assign({}, obj); // Make new object
        const updateKey = (key, newValue, obj) => {
          if (typeof obj !== "object") return; // Basecase
          if (obj[key]) obj[key] = newValue; // Look for and edit property
          else
            for (let prop in obj) {
              updateKey(key, newValue, obj[prop]); // Go deeper
            }
        };
        updateKey(key, newValue, newObj);
        return newObj;
      };

      /**
       * Rename object all keys base on schema
       * The detail refer to https://stackoverflow.com/questions/62135524/how-to-rename-the-object-key-in-nested-array-of-object-in-javascript-dynamically
       * @alias module:object.renameKeys
       * @param {Object} keysMaps - The new keys schema.
       * @param {Object} node  - Data source.
       * @returns {Object}
       */
      lib["renameObjectKeys"] = (node, keysMaps) => {
        const renameKeys = (node, keysMaps) => {
          if (typeof node !== "object" && !Array.isArray(node)) return node;
          if (Array.isArray(node))
            return node.map((item) => renameKeys(item, keysMaps));

          return Object.entries(node).reduce((result, [key, value]) => {
            const newKey = keysMaps[key] || key;
            return {
              ...result,
              [newKey]: renameKeys(value, keysMaps),
            };
          }, {});
        };
        return renameKeys(node, keysMaps);
      };

      /**
       * The main objective is find the value base on nested keyname
       * The detail refer to https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
       * @alias module:utils.mergeDeep
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
       * Return object where option is the key, value is the value for the key
       * @alias module:object.insert2obj
       * @param {Array} option - Array of string for key.
       * @param {Array} value  - Array of value for the key that must be sequence as the option.
       * @returns {Object} - Object that has been assigned to the key and value.
       */
      lib["insert2obj"] = (option, value) => {
        let output = {};
        try {
          sysmodule.lodash.map(option, (val, id) => {
            output[val] = value[id];
          });

          return output;
        } catch (error) {
          return error;
        }
      };

      /**
       * The main objective is delete keys values pair by keys name
       * The detail refer to https://stackoverflow.com/questions/43011742/how-to-omit-specific-properties-from-an-object-in-javascript
       * @alias module:utils.omit
       * @param {Object} object - Source data
       * * @param {String} keys - Add empty space between key and next key when need delete multiple keys
       * @returns {Object} - Return object
       */
      lib["omit"] = (object, keys) => {
        let rtn = object;
        keys.split(" ").map((val) => {
          const { [val]: omitted, ...rest } = rtn;
          rtn = rest;
        });
        return rtn;
      };

      /**
       * Parse the string to Json in json.
       * @alias module:utils.string2json
       * @param {String} value - Only the string of content which meet to json format requirement able to parse json
       * @returns {Object| string } - Empty value string return empty object,
       *  the return data will same as param when the param data type not equal to string
       */
      lib.string2json = (value) => {
        try {
          let output = {};
          if (value != "") {
            let typeval = typeof value;
            if (typeval == "object") output = value;
            else {
              if (
                value.indexOf("{") > -1 &&
                value.indexOf("}") > -1 &&
                value.indexOf(":") > -1
              )
                output = Object.assign(output, JSON.parse(value));
              else output = value;
            }
          }
          return output;
        } catch (e) {
          return e;
        }
      };

      /**
       * Serialize execution of a set of functions
       * @alias module:utils.serialize
       *  @param {Object} obj - The source of functions prepare to call by proc defination especially kernel.utils
       * @param {Object} proc - Value support all data type
       * @param {Object} next - When error happen will execution if not undefined
       * @returns {Object} - Return final result
       */
      lib["serialize"] = async (...args) => {
        return new Promise(async (resolve, reject) => {
          const [obj, proc, next] = args;
          const { getNestedObject, updateObject, errhandler } = obj.utils;
          let output = {
            code: 0,
            msg: "",
            data: null,
          };
          try {
            const pre_funcparam = (...args) => {
              let [obj, params] = args;
              let output = [];
              for (let queue of params) {
                let paramdata = getNestedObject(obj, queue);
                if (paramdata) output.push(paramdata);
              }
              return output;
            };
            for (let [, compval] of Object.entries(proc)) {
              let { func } = compval;
              let fn = getNestedObject(obj.library, func);
              if (!fn) {
                output.code = -3;
                output.msg = `Cannot find "${func}" function int object!`;
                break;
              }
            }
            if (output.code == 0) {
              let funcparam_next;
              for (let [, compval] of Object.entries(proc)) {
                let { func, merge, joinp, params } = compval;
                let fn = getNestedObject(obj.library, func);
                let funcparams = [];
                let queuertn;
                if (params) {
                  funcparams = [
                    ...funcparams,
                    ...pre_funcparam(obj.params, params),
                  ];
                  funcparam_next = undefined;
                } else if (joinp) {
                  funcparams = [
                    ...funcparams,
                    ...structuredClone(funcparam_next),
                    ...pre_funcparam(obj.params, params),
                  ];
                  funcparam_next = undefined;
                }
                queuertn = await fn.apply(null, funcparams);
                funcparam_next = [...funcparams];
                let { code, data } = queuertn;
                if (code == 0) {
                  if (merge) {
                    jptr.set(obj, merge.param, data);
                  }
                } else {
                  if (next) next.failure(queuertn);
                }
              }
            } else {
              if (next.failure) next.failure(output);
            }
            resolve(output);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      };

      /**
       *  Produce all try catch error returning data format
       * @alias module:utils.errhandler
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - error try catch errror value
       * @returns {Object} - Return value
       */
      lib["errhandler"] = (...args) => {
        let [error] = args;
        if (error.errno)
          return {
            code: error.errno,
            errno: error.errno,
            message: error.message,
            stack: error.stack,
            data: error,
          };
        else
          return {
            code: -1,
            errno: -1,
            message: error.message,
            stack: error.stack,
            data: error,
          };
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
