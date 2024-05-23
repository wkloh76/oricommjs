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
 * The submodule of helper
 * @module utils_handler
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [pathname, curdir] = args;
    try {
      let lib = {
        /**
         * Getter the dataformat value
         * @type {Object}
         * @memberof module:property.dataformat
         * @instance
         */
        get dataformat() {
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
         *  Getter the restful api dataformat value
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
         *  Getter the electron ipc events dataformat value
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
         *  Getter the web view render as html dataformat value
         * @type {Object}
         * @memberof module:property.webview
         * @instance
         */
        get webview() {
          return Object.assign(
            {},
            {
              options: {
                css: { locally: [], other: [], remotely: [] },
                html: "",
                injectioncss: {},
                injectionjs: { variables: {}, modules: {} },
                injectionless: {},
                js: { locally: [], other: [], remotely: [] },
                json: {},
                layer: {
                  layouts: "",
                  childs: { path: "", excluded: [], external: [] },
                },
                less: {
                  engine: { locally: "", remotely: "", other: "" },
                  style: { locally: [], other: [], remotely: [] },
                },
                mjs: { initialize: {}, locally: [], other: [], remotely: [] },
                menu: {},
                params: { locally: "", remotely: "" },
                redirect: "",
                show: true,
                tray: {},
              },
              status: 200,
              view: "",
            }
          );
        },
      };

      /**
       * Pick data frontend, either post or get value
       * @alias module:method.getprm
       * @param {Array} args - Expresss framework request object
       * @returns {Object} - Return  value
       */
      lib.getprm = function (...args) {
        let [req] = args;
        let output = {};
        try {
          let isquery = lib.check_empty(req.query);
          let isbody = lib.check_empty(req.body);
          let isparams = lib.check_empty(req.params);
          if (!isquery) output = { ...output, ...req.query };
          if (!isbody) output = { ...output, ...req.body };
          if (!isparams) output = { ...output, ...req.params };
          return output;
        } catch (error) {
          return error;
        }
      };

      /**
       * Checking the value is empty or not
       * @alias module:method.check_empty
       * @param {...Object} args - 2 parameters
       * @param {Array} args[0] - input is a data
       * @returns {Object} - Return  value
       */
      lib.check_empty = function (...args) {
        let [input] = args;
        let type = typeof input;
        let output = false;

        try {
          if (type == "object") {
            if (Array.isArray(input)) type = "array";
          }

          switch (type) {
            case "string":
              if (input === "") output = true;
              break;
            case "object":
              if (Object.keys(input).length === 0) output = true;
              break;
            case "array":
              if (input.length === 0) output = true;
              break;
          }

          return output;
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
