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
 * The submodule helper module
 * @module utils_helper_datatype
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [pathname, curdir] = args;
    try {
      let lib = {};

      /**
       * Get the data type
       * @alias module:datatype.get_datatype
       * @param {string| number| boolean| Object| Array} value - Determine the data type of the parameter
       * @returns {string}
       */
      lib.get_datatype = (value) => {
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

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
