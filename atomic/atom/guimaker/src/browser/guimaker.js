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
  const { default: utils } = await import(`./guimaker/utils/utils.js`);
  const { default: sysmodule } = await import(
    `./guimaker/sysmodule/sysmodule.js`
  );
  try {
    const regevent = (...args) => {
      const [param, objfuncs] = args;
      const { getNestedObject, handler } = utils;

      for (let [, valobjevent] of Object.entries(param)) {
        for (let [key, value] of Object.entries(valobjevent)) {
          for (let [evt, fn] of Object.entries(value)) {
            let qs = document.querySelector(evt);
            if (qs) {
              let func = getNestedObject(objfuncs, fn);
              if (func) qs.addEventListener(key, func);
            }
          }
        }
      }
    };

    let lib = { library: { utils, regevent: regevent }, sysmodule };

    return lib;
  } catch (error) {
    return error;
  }
})();
