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
 * THe main module of utils
 * @module utils_index
 */
module.exports = (...args) => {
  return new Promise(async (resolve, reject) => {
    const [mpath, mname] = args;
    const { fs, path } = sysmodule;
    const { excludefile } = coresetting.general;
    try {
      let lib = {};
      /**
       * The main objective is find the value base on nested keyname
       * The detail refer to https://github.com/flexdinesh/typy
       * @alias module:app.dir_module
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
       * @alias module:app.import_cjs
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
                  modpath,
                  val,
                  curdir
                );
                arr_name.push(val);
                arr_process.push(module);
              }
            }
            let arrrtn = await Promise.all(arr_process);
            for (let [idx, val] of Object.entries(arrrtn)) {
              if (curdir != "components") modules[arr_name[idx]] = val;
              else val.done();
            }
            resolve(modules);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      };

      /**
       * The main objective base on list dynamic import ES modules
       * The detail refer to https://github.com/flexdinesh/typy
       * @alias module:app.import_mjs
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
                  modpath,
                  val,
                  curdir
                );
                arr_name.push(val);
                arr_process.push(module);
              }
            }
            let arrrtn = await Promise.all(arr_process);
            for (let [idx, val] of Object.entries(arrrtn)) {
              if (curdir != "components") modules[arr_name[idx]] = val;
              else val.done();
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
       * @alias module:app.getNestedObject
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
       * @alias module:app.updateObject
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
      lib["renameObjectKeys"] = (keysMaps, node) => {
        // if (!isObject(node)) return node;
        // if (Array.isArray(node))
        //   return node.map((item) => lib.renameKeys(item, keysMaps));

        // return Object.entries(node).reduce((result, [key, value]) => {
        //   const newKey = keysMaps[key] || key;
        //   return {
        //     ...result,
        //     [newKey]: lib.renameKeys(value, keysMaps),
        //   };
        // }, {});

        const renameKeys = (node, keysMaps) => {
          if (typeof node !== "object" && !Array.isArray(item)) return node;
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

      // const renameKeys = (node, keysMaps) => {
      //   if (typeof node !== "object") return node;
      //   if (Array.isArray(node))
      //     return node.map((item) => renameKeys(item, keysMaps));

      //   return Object.entries(node).reduce((result, [key, value]) => {
      //     const newKey = keysMaps[key] || key;
      //     return {
      //       ...result,
      //       [newKey]: renameKeys(value, keysMaps),
      //     };
      //   }, {});
      // };

      // let test = {
      //   abc: 1,
      //   wait: { abc: 13, wait: { abc: 130 }, hole: [{ abc: 1200 }] },
      // };
      // console.log(JSON.stringify(test));
      // console.log(JSON.stringify(renameKeys(test, { abc: "abb" })));
      // console.log(JSON.stringify(renameKeys(test, { wait: "wait1" })));

      /**
       * Serialize execution of a set of functions
       * @alias module:app.serialize
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
                    for (let [mkey, mval] of Object.entries(merge)) {
                      obj[mkey] = {
                        ...obj[mkey],
                        ...updateObject(mval, data[mval], obj[mkey]),
                      };
                    }
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
       * @alias module:app.errhandler
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

      let modfolders = lib.dir_module(mpath, excludefile);
      lib = {
        ...lib,
        ...(await lib.import_cjs([mpath, modfolders, mname], lib)),
      };
      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
