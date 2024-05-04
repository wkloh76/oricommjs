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
module.exports = (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    try {
      const lib = {
        /**
         * The dataformat value
         * @type {Object}
         * @memberof module:property.dataformat2
         * @instance
         */
        dataformat2: () => {
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
         * Restful api dataformat value
         * @type {Object}
         * @memberof module:property.restfulapi
         * @instance
         */
        restfulapi: () => {
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
         * The electron ipc events dataformat value
         * @type {Object}
         * @memberof module:property.ipcevent
         * @instance
         */
        ipcevent: () => {
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
         * The web view render as html dataformat value
         * @type {Object}
         * @memberof module:property.webview
         * @instance
         */
        webview: () => {
          return Object.assign(
            {},
            {
              status: 200,
              options: {
                css: {
                  locally: [],
                  remotely: [],
                  other: [],
                },
                elcontent: {},
                injectioncss: {},
                injectionjs: {},
                injectionless: {},
                js: { locally: [], remotely: [], other: [] },
                json: {},
                layer: {
                  layouts: "",
                  childs: {
                    path: "",
                    excluded: [],
                    external: [],
                  },
                },
                less: {
                  engine: { domain: "", location: "" },
                  style: {
                    locally: [],
                    remotely: [],
                    other: [],
                  },
                },
                menu: {},
                params: { locally: "", remotely: "", mjs: {} },
                redirect: "",
                show: true,
                text: "",
                tray: {},
              },
              view: "",
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
