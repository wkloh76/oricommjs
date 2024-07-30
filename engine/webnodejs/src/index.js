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
 * The asistant of main module which is handle the submodule in each sub folder.
 * @module src_index
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    try {
      let reaction = await require("./reaction")(params, obj);
      let webserver = await require("./webserver")(params, obj);

      let lib = {};

      lib["register"] = (...args) => {
        let [oncomponents, compname, engine] = args;
        if (compname.indexOf(`${engine.type}_`) > -1) {
          reaction["register"](oncomponents);
        }
      };

      lib["start"] = async (...args) => {
        let [setting] = args;
        try {
          let rtn = await webserver.start(setting, reaction);
          if (rtn) throw rtn;
          return;
        } catch (error) {
          return error;
        }
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
