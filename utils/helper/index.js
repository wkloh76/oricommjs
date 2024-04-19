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
 * The main module of helper
 * @module utils_helper_index
 */
module.exports = (...args) => {
  return new Promise(async (resolve, reject) => {
    const [pathname, curdir] = args;
    try {
      let lib = {
        ...(await require("./array")(pathname, curdir)),
        ...(await require("./conversion")(pathname, curdir)),
        ...(await require("./datatype")(pathname, curdir)),
        ...(await require("./object")(pathname, curdir)),
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
