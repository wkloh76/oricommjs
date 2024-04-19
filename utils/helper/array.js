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
 * @module utils_helper_array
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [pathname, curdir] = args;
    try {
      let lib = {};

      /**
       * Pick data from the array object as the defination from option
       * @alias module:array.pick_arryobj
       * @param {Array} option - Array of string which base on keyname to pickup entire key and value
       * @param {Array} value  - Array of object
       * @returns {Array} - Return empty array if cannot get the key from the value
       */
      lib.pick_arryobj = (option, value) => {
        try {
          let output = [];
          for (let obj of value) {
            output.push(sysmodule.lodash.pick(obj, option));
          }
          return output;
        } catch (e) {
          return e;
        }
      };

      /**
       * Convert string to object, the default return data is empyt object if compare value is empty string
       * @alias module:array.arr_objectjson
       * @param {Array} value - Array of object
       * @returns {Array} - Nothing change if some value not meet to requirement
       */
      lib.arr_objectjson = (value) => {
        try {
          let output = sysmodule.lodash.map(value, (obj) => {
            let rtnobj = {};
            sysmodule.lodash.map(obj, (val, key) => {
              let typeval = typeof val;
              if (typeval != "string") rtnobj[key] = val;
              else {
                if (val == "") {
                  rtnobj[key] = {};
                } else if (
                  (val.indexOf("{") > -1 &&
                    val.indexOf("}") > -1 &&
                    val.indexOf(":") > -1) ||
                  (val.indexOf("[") > -1 && val.indexOf("]") > -1)
                ) {
                  rtnobj[key] = JSON.parse(val);
                } else {
                  rtnobj[key] = val;
                }
              }
            });
            return rtnobj;
          });
          return output;
        } catch (e) {
          return e;
        }
      };

      /**
       * Insert multi values to new object base on constant keys sequnce define by user
       * @alias module:array.arr_constkey_insertobj
       * @param {Array} option - Array of string
       * @param {Array} value - Multi dimesiion array of any datatype value
       * @returns {Array}
       */
      lib.arr_constkey_insertobj = (option, values) => {
        try {
          return sysmodule.lodash.map(values, (value) => {
            let output = {};
            sysmodule.lodash.map(option, (val, id) => {
              output[val] = value[id];
            });
            return output;
          });
        } catch (e) {
          return e;
        }
      };

      /**
       * Insert element to the parent object by selected array of index.
       * @alias module:array.arr_objpick_insert
       * @param {Array} src - Array of object from parent.
       * @param {Array} target - Array of value for selected index of source.
       * @param {Object} objval - Object of value for insert to parent.
       * @returns {Array} - Nothing change if some value not meet to requirement
       */
      lib.arr_objpick_insert = (src, target, objval) => {
        try {
          let output = src;
          sysmodule.lodash.map(target, (val) => {
            output[val] = Object.assign(output[val], objval);
          });
          return output;
        } catch (e) {
          return e;
        }
      };

      /**
       * Delete element from the parent object by selected array of index base on object key name.
       * @alias module:array.arr_objpick_delete
       * @param {Array} src - Array of object from parent.
       * @param {Array} target - Array of value for selected index of source.
       * @param {Array} objkeys - Compare Keys of Object which is match to parent keys.
       * @returns {Array} - Nothing change if some value not meet to requirement
       */
      lib.arr_objpick_delete = (src, target, objkeys) => {
        try {
          let output = src;
          sysmodule.lodash.map(target, (val) => {
            sysmodule.lodash.map(objkeys, (keyname) => {
              if (keyname in output[val]) delete output[val][keyname];
            });
          });
          return output;
        } catch (e) {
          return e;
        }
      };

      /**
       * Update element value from the parent object by selected array of index base on object key name.
       * @alias module:array.arr_objpick_delete
       * @param {Array} src - Array of object from parent.
       * @param {Array} target - Array of value for selected index of source.
       * @param {Object} objval - Object of value for update to parent.
       * @returns {Array} - Nothing change if some value not meet to requirement
       */
      lib.arr_objpick_update = (src, target, objval) => {
        try {
          let output = src;
          sysmodule.lodash.map(target, (val) => {
            sysmodule.lodash.map(objval, (keyvalue, keyname) => {
              if (keyname in output[val]) output[val][keyname] = keyvalue;
            });
          });
          return output;
        } catch (e) {
          return e;
        }
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
