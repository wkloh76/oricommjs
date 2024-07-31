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
 * The submodule of utils
 * @module utils_intercomm
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [pathname, curdir] = args;
    const event = require("events");
    try {
      let myemitter = new event.EventEmitter();

      function register(...args) {
        let [ch, opt, fn] = args;
        let output;
        try {
          switch (opt) {
            case "always":
              myemitter.on(ch, fn);
              break;
            case "once":
              myemitter.once(ch, fn);
              break;
          }
        } catch (error) {
          output = error;
        } finally {
          return output;
        }
      }

      function fire(...args) {
        let [ch, param] = args;
        let output;
        try {
          myemitter.emit(ch, ...param);
        } catch (error) {
          output = error;
        } finally {
          return output;
        }
      }
      let lib = { register: register, fire: fire };
      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
