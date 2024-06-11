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
 * The submodule smfetch module
 * @module atom
 */
export default await (() => {
  try {
    /* -----Comment-------
       var dataformat = {
     	method: "POST", // *GET, POST, PUT, DELETE, etc.
     	mode: "same-origin", // no-cors, *cors, same-origin
     	cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
     	credentials: "same-origin", // include, *same-origin, omit
     	headers: {
     		"Content-Type": "application/json", // *application/json. 'application/x-www-form-urlencoded',
     	},
     	redirect: "follow", // manual, *follow, error
     	referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
     	body: null, // * JSON.stringify(data) body data type must match "Content-Type" header
      };
    */

    /**
     * Arrange data the data suit to webfetch options
     * @alias module:httpns.options
     * @param {Object} error - Any data type
     * @returns {Object} - Return error data in json format
     */
    const options = (...args) => {
      let [options] = args;
      let { url, cache, credentials, reqdata, origin, ...output } = options;

      switch (output.method) {
        case "GET":
          url = new URL(url);
          if (reqdata !== undefined) {
            if (typeof reqdata == "object")
              url.search = new URLSearchParams(
                JSON.parse(JSON.stringify(reqdata))
              ).toString();
            else if (typeof reqdata == "string") url.search = reqdata;
          }
          break;

        default:
          if (typeof reqdata == "object") {
            output["headers"] = {
              ...output["headers"],
              ...{
                "Content-Type": "application/json",
              },
            };
            output["body"] = JSON.stringify(reqdata);
          } else if (typeof reqdata == "string") {
            output["headers"] = {
              ...output["headers"],
              ...{
                "Content-Type": "text/plain;charset=UTF-8",
              },
            };
            output["body"] = reqdata;
          }
          break;
      }

      output["url"] = url;
      if (credentials) output["credentials"] = "same-origin";
      else output["credentials"] = "include";
      if (origin) output["mode"] = "cors";
      else output["mode"] = "same-origin";
      if (cache) output["cache"] = "default";
      else output["cache"] = "no-cache";
      return output;
    };

    /**
     * Arrange data the data suit to tronfetch options
     * @alias module:httpns.eoptions
     * @param {Object} error - Any data type
     * @returns {Object} - Return error data in json format
     */
    const eoptions = (options) => {
      let output = { method: options.method, originalUrl: options.url };

      switch (options.method.toUpperCase()) {
        case "GET":
          output["query"] = {};
          if (options?.["dataType"] === "json") {
            if (typeof options.data == "object") output["param"] = options.data;
          } else if (typeof options.data == "string") {
            const mySearchParams = new URLSearchParams(options.data);
            let myobj = {};
            for (const [key, value] of mySearchParams.entries()) {
              myobj[key] = value;
            }
            output["query"] = myobj;
          }
          break;

        case "POST":
          output["body"] = options.data;
          break;
      }
      if (options?.["headers"]) output["headers"] = options.headers;
      return output;
    };

    /**
     * FIre fetch api request in async method
     * @alias module:fetchapi.request
     * @param {...Object} args - 1 parameters
     * @param {Object} args[0] - param for call api server base on fecth api format
     * @param {Object} args[0] - param.url api server request link
     * @param {Object} args[0] - param.method request method (support RESTFUL API)
     * @param {Object} args[0] - param.data transfer to api server,in String or Json object
     * @param {Object} args[0] - param.success data callback from server
     * @param {Object} args[0] - param.error error callback from server
     * @param {Object} args[0] - param.option cretical setting
     * @param {Object} args[0] - param.option.async if false the client wait until api server response,default true
     * @param {Object} args[0] - param.option.origin if true cross-origin requests are allowed,default false
     * @param {Object} args[0] - param.option.cache if true the reequested pages cached by the browser,default false
     * @param {Object} args[0] - param.option.headers can assign such as HTTP-Authorization basic headers
     */
    const webfetch = async (...args) => {
      let [param] = args;
      try {
        let data = {};
        let {
          async = true,
          url,
          method,
          data: reqdata,
          success: achieve,
          error: fault,
          option = {},
        } = param;

        let {
          origin = false,
          cache = false,
          credentials = true,
          redirect = false,
          headers = {},
          ...opt
        } = option;

        data = options({
          ...opt,
          ...{ headers: headers },
          origin,
          cache,
          credentials,
          url,
          method,
          reqdata,
        });

        if (async) {
          fetch(data.url, data)
            .then(async (response) => {
              if (response.ok) {
                if (param?.success) {
                  let result = {};
                  if (response.redirected) result.redirected = response.url;
                  else result.data = await response.json();
                  param.success({
                    status: response.status,
                    statusText: response.statusText,
                    data: result,
                  });
                }
              } else {
                if (param?.error) {
                  param.error({
                    status: response.status,
                    statusText: response.statusText,
                  });
                }
              }
            })
            .catch((error) => {
              return {
                code: -1,
                msg: error.message,
                data: null,
              };
            });
          return;
        } else {
          let response = await fetch(data.url, data);
          let result = {
            status: response.status,
            statusText: response.statusText,
          };
          if (response.ok) {
            if (response.redirected) {
              result.redirected = response.url;
            } else {
              result.data = await response.json();
              if (param?.success) {
                param.success(result);
              }
            }
          } else {
            if (param?.error) {
              param.error(result);
            }
          }
          return result;
        }
      } catch (error) {
        return {
          code: -1,
          msg: error.message,
          data: null,
        };
      }
    };

    /**
     * FIre fetch api request in async method
     * @alias module:fetchapi.request
     * @param {...Object} args - 1 parameters
     * @param {Object} args[0] - param for call api server base on electron ContentBridge format
     */
    const deskfectch = async (...args) => {
      try {
        let [param] = args;
        let data = {};
        let async = true;

        data = eoptions(param);
        if (param?.success !== undefined) data.success = param.success;
        if (param?.error !== undefined) data.error = param.error;
        if (param?.async !== undefined) async = param.async;
        data.async = async;

        if (async) {
          window.fetchapi.request(data);
          return;
        } else {
          return await window.fetchapi.request(data);
        }
      } catch (error) {
        console.log(error);
      }
    };
    
    let lib = { webfetch: webfetch, deskfectch: deskfectch };
    return lib;
  } catch (error) {
    console.log(error);
  }
})();
