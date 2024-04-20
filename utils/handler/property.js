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
 * The submodule handler - property
 * @module utils_handler_property
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    try {
      let lib = {
        /**
         * Getter the dataformat value
         * @type {Object}
         * @memberof module:property.dataformat2
         * @instance
         */
        get dataformat2() {
          return Object.assign(
            {},
            {
              code: 0,
              msg: "",
              data: null,
            }
          );
        },

        /**
         * Getter the restful api dataformat value
         * @type {Object}
         * @memberof module:property.restfulapi
         * @instance
         */
        get restfulapi() {
          return Object.assign(
            {},
            {
              DELETE: {},
              HEAD: {},
              GET: {},
              PATCH: {},
              POST: {},
              PUT: {},
            }
          );
        },

        /**
         * Getter the electron ipc events dataformat value
         * @type {Object}
         * @memberof module:property.ipcevent
         * @instance
         */
        get ipcevent() {
          return Object.assign(
            {},
            {
              hanlde: {},
              on: {},
              once: {},
              handleOnce: {},
            }
          );
        },

        /**
         * Getter the web view render as html dataformat value
         * @type {Object}
         * @memberof module:property.webview
         * @instance
         */
        get webview() {
          return Object.assign(
            {},
            {
              status: 200,
              view: "",
              options: {
                show: true,
                tray: {},
                menu: {},
                layer: "",
                params: {},
                json: {},
                redirect: "",
                text: "",
                css: [],
                js: [],
              },
            }
          );
        },
      };
      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
