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
 * The submodule of interface
 * @module events
 */
export default await (async () => {
  let library, sys;
  try {
    let lib = {};

    lib.load = (...args) => {
      const [kernel, sysmodule] = args;
      library = kernel;
      sys = sysmodule;
    };

    lib.regevents = (...args) => {
      const [param, objfuncs] = args;
      const { utils } = library;
      const { datatype, errhandler, getNestedObject, handler } = utils;
      let output = handler.dataformat;
      try {
        for (let [, valobjevent] of Object.entries(param)) {
          for (let [key, value] of Object.entries(valobjevent)) {
            for (let [evt, fn] of Object.entries(value)) {
              let qs = document.querySelectorAll(evt);
              if (qs) {
                for (let nodevalue of qs) {
                  if (typeof fn === "function")
                    nodevalue.addEventListener(key, fn);
                  else if (datatype(fn) === "string") {
                    let func = getNestedObject(objfuncs, fn);
                    if (func) nodevalue.addEventListener(key, func);
                  } else if (datatype(fn) === "object") {
                    if (fn.attr) {
                      for (let [attrkey, attrval] of Object.entries(fn.attr))
                        nodevalue.setAttribute(attrkey, attrval);
                    }
                    let func = getNestedObject(objfuncs, fn.evt);
                    if (func) nodevalue.addEventListener(key, func);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };

    return lib;
  } catch (error) {
    return error;
  }
})();
