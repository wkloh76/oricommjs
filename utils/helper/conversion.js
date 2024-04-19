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
 * The submodule of helper module
 * @module utils_helper_conversion
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [pathname, curdir] = args;
    try {
      let lib = {};

      /**
       * Parse the string to Json in json.
       * @alias module:conversion.string2json
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

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
