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
    const [mpath, mname, cosetting] = args;
    try {
      let lib = {
        ...(await require("./utils")(mpath, mname)),
      };
      lib["handler"] = await require("./handler")(mpath, mname);
      lib["powershell"] = await require("./powershell")(mpath, mname);
      lib["intercomm"] = await require("./intercomm")(mpath, mname);

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
