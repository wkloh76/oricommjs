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
 * The smfetch module
 * @module smfetch
 */
export default await (async () => {
  let { default: atom } = await import(`./smfetch/atom.js`);

  let lib = {};

  const urlidentify = (...args) => {
    let [url] = args;
    let output = { code: 0, msg: "", data: null };
    try {
      new URL(url);
      output.data = { method: "webfetch", url: url };
    } catch (error) {
      let compname = url.split("/").slice(0, 2).join("");
      if (compname.indexOf("desktop_") > -1)
        output.data = { method: "deskfetch", url: url };
      else if (compname.indexOf("web_") > -1)
        output.data = {
          method: "webfetch",
          url: `${window.location.origin}${url}`,
        };
      else {
        output.code = -10;
        output.msg = error.stack;
      }
    } finally {
      return output;
    }
  };
  /**
   * FIre fetch api request in async method
   * @alias module:fetchapi.request
   * @param {...Object} args - 1 parameters
   * @param {Object} args[0] - param for call api server base on fecth api format
   */
  lib.request = (...args) => {
    return new Promise(async (resolve, reject) => {
      try {
        let [param] = args;
        let { async = true } = param;
        let rtn = urlidentify(param.url);
        if (rtn.code !== 0) throw rtn;
        param.url = rtn.data.url;
        if (!async) resolve(await atom[rtn.data.method](param));
        else resolve(atom[rtn.data.method](param));
      } catch (error) {
        resolve(error);
      }
    });
  };

  return lib;
})();
