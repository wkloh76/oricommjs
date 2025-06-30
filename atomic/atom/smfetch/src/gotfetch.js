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
 * A module which handle web api fetch in backend server service
 * @module src_got
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { utils } = library;
    const { handler } = utils;
    const { fs } = sys;
    const { createWriteStream } = fs;
    const { default: got } = await import("got");
    const FormData = require("form-data");
    const jsonToFormData = require("@ajoelp/json-to-formdata");
    const stream = require("stream");
    const { promisify } = require("util");
    const pipeline = promisify(stream.pipeline);
    try {
      let lib = {};

      /**
       * Handle error throw by got module
       * @alias module:gotfetch.goterr
       * @param {Object} error - Any data type
       * @returns {Object} - Return error data in json format
       */
      const goterr = (error) => {
        let err = { code: -1, data: error.data, msg: error.message };
        switch (error.code) {
          case "ERR_ABORTED":
            err.code = -2;
            break;
          case "EHOSTUNREACH":
            err.code = -3;
            break;

          case "ETIMEDOUT":
            err.code = -4;
            break;
          case "ZEROSIZE":
            err.code = -5;
            break;
        }
        return err;
      };

      /**
       * Arrange data the data suit to got options
       * @alias module:gotfetch.gotoption
       * @param {Object} error - Any data type
       * @returns {Object} - Return error data in json format
       */
      const gotoption = (options) => {
        let output = { method: options.method, url: options.url };
        switch (options.method) {
          case "DOWNLOAD":
            delete output.method;
            if (options?.["source"]) `${options.url}/${options.source}`;
            else output["url"] = `${options.url}`;
            break;
          case "DELETE":
            output["url"] = `${options.url}/${Object.values(options.data).join(
              "/"
            )}`;
            break;
          case "GET":
            if (options?.["datatype"] === undefined)
              output["url"] = `${options.url}?${options.data}`;
            else if (options["datatype"] === "qs")
              output["searchParams"] = new URLSearchParams(options.data);
            break;

          case "HEAD":
            break;

          case "POST":
            if (options.data) output["json"] = options.data;
            break;

          case "PUT":
            output["url"] = `${options.url}/${Object.values(options.data).join(
              "/"
            )}`;
            break;
          case "PATCH":
            output["url"] = `${options.url}/${Object.values(options.data).join(
              "/"
            )}`;
            break;
        }
        if (options?.["headers"]) output["headers"] = options.headers;
        return output;
      };

      /**
       * Call HTTP/HTTPS DELETE
       * @alias module:gotfetch.delete
       * @param {Object} param - Data in object type.
       * @param {Object} param.data - Data in json format. Note: The sequence will follow defination
       * @param {Object} param.headers - HTTP headers
       * @param {Number} param.timeout - Abort the wating responding time from web server.
       * @param {String} param.url - The URL for Web API or web server
       * @returns {Object} - The result return with property (code, data, msg)
       */
      lib.delete = (...args) => {
        return new Promise(async (resolve) => {
          let [param] = args;
          try {
            const abortController = new AbortController();
            let options = gotoption(Object.assign({ method: "DELETE" }, param));

            if (param?.["timeout"]) {
              options["signal"] = abortController.signal;
              setTimeout(() => {
                abortController.abort();
              }, param["timeout"]);
            }
            let output = await got(options).json();
            resolve(output);
          } catch (error) {
            resolve(goterr(error));
          }
        });
      };

      /**
       * Call HTTP/HTTPS GET
       * @alias module:gotfetch.get
       * @param {Object} param - Data in object type.
       * @param {String} param.datatype - "qs" will convert the json data to URLSearchParams pattern
       * @param {Object} param.data - Data in json format
       * @param {Object} param.headers - HTTP headers example basic auth
       * @param {Number} param.timeout - Abort the wating responding time from web server.
       * @param {String} param.url - The URL for Web API or web server
       * @returns {Object} - The result return with property (code, data, msg)
       */
      lib.get = (...args) => {
        return new Promise(async (resolve) => {
          try {
            const abortController = new AbortController();
            let [param] = args;
            let options = gotoption(Object.assign({ method: "GET" }, param));

            if (param?.["timeout"]) {
              options["signal"] = abortController.signal;
              setTimeout(() => {
                abortController.abort();
              }, param["timeout"]);
            }

            let output = await got(options).json();

            resolve(output);
          } catch (error) {
            resolve(goterr(error));
          }
        });
      };

      /**
       * Call HTTP/HTTPS HEAD
       * @alias module:gotfetch.head
       * @param {Object} param - Data in object type.
       * @param {Object} param.headers - HTTP headers example basic auth
       * @param {Number} param.timeout - Abort the wating responding time from web server.
       * @param {String} param.url - The URL for Web API or web server
       * @returns {Object} - The result return with property (code, data, msg)
       */
      lib.head = (...args) => {
        return new Promise(async (resolve) => {
          try {
            const abortController = new AbortController();
            let [param] = args;
            let options = gotoption(Object.assign({ method: "HEAD" }, param));

            if (param?.["timeout"]) {
              options["signal"] = abortController.signal;
              setTimeout(() => {
                abortController.abort();
              }, param["timeout"]);
            }

            await got(options).json();
            resolve({ code: 0, data: null, msg: "" });
          } catch (error) {
            resolve(goterr(error));
          }
        });
      };

      /**
       * Call HTTP/HTTPS POST
       * @alias module:gotfetch.post
       * @param {Object} param - Data in object type.
       * @param {Object} param.data - Data in json format
       * @param {Object} param.headers - HTTP headers
       * @param {Number} param.timeout - Abort the wating responding time from web server.
       * @param {String} param.url - The URL for Web API or web server
       * @returns {Object} - The result return with property (code, data, msg)
       */
      lib.post = (...args) => {
        return new Promise(async (resolve) => {
          try {
            const abortController = new AbortController();
            let [param] = args;
            let options = gotoption(Object.assign({ method: "POST" }, param));

            if (param?.["timeout"]) {
              options["signal"] = abortController.signal;
              setTimeout(() => {
                abortController.abort();
              }, param["timeout"]);
            }

            let output = await got(options).json();
            resolve(output);
          } catch (error) {
            resolve(goterr(error));
          }
        });
      };

      /**
       * Call HTTP/HTTPS PUT
       * @alias module:gotfetch.put
       * @param {Object} param - Data in object type.
       * @param {Object} param.data - Data in json format
       * @param {Object} param.headers - HTTP headers
       * @param {Number} param.timeout - Abort the wating responding time from web server.
       * @param {String} param.url - The URL for Web API or web server
       * @returns {Object} - The result return with property (code, data, msg)
       */
      lib.put = (...args) => {
        return new Promise(async (resolve) => {
          try {
            const abortController = new AbortController();
            let [param] = args;
            let options = gotoption(Object.assign({ method: "PUT" }, param));

            if (param?.["timeout"]) {
              options["signal"] = abortController.signal;
              setTimeout(() => {
                abortController.abort();
              }, param["timeout"]);
            }

            let output = await got(options).json();
            resolve(output);
          } catch (error) {
            resolve(goterr(error));
          }
        });
      };

      /**
       * Call HTTP/HTTPS DOWNLOAD
       * @alias module:gotfetch.download
       * @param {Object} param - Data in object type.
       * @param {Object} param.headers - HTTP headers example basic auth
       * @param {Object} param.location - Local directory for save file
       * @param {Object} param.source - The origin file name from http server
       * @param {Object} param.target - The file name for save locally, if undefined will apply param.source
       * @param {String} param.url - The URL for Web API or web server
       * @returns {Object} - The result return with property (code, data, msg)
       */
      lib.download = (...args) => {
        return new Promise(async (resolve, reject) => {
          try {
            let [param] = args;
            let headers = {
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
              "Accept-Encoding": "gzip, deflate, br",
              "Accept-Language":
                "en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3",
              "Cache-Control": "max-age=0",
              Connection: "keep-alive",
              "Upgrade-Insecure-Requests": "1",
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
            };

            let location = param.location;
            let tagname = param.target;

            let options = gotoption(
              Object.assign({ method: "DOWNLOAD" }, param)
            );

            if (options?.["headers"]) {
              options["headers"] = Object.assign(options["headers"], headers);
            } else options["headers"] = Object.assign({}, headers);

            if (param?.["target"]) tagname = param.target;

            tagname = `${location}/${tagname}`;

            console.log(options);
            const downloadStream = got.stream(options);
            const fileWriterStream = createWriteStream(tagname);

            fileWriterStream
              .on("error", (error) => {
                let stats = fs.statSync(tagname);
                let fileSizeInBytes = stats.size;
                if (fileSizeInBytes == 0)
                  resolve(
                    goterr({
                      code: "ZEROSIZE",
                      data: { file: tagname },
                      message: "Zero file size",
                    })
                  );
                else resolve({ code: 0, data: null, msg: "" });
              })
              .on("finish", () => {
                let stats = fs.statSync(tagname);
                let fileSizeInBytes = stats.size;
                if (fileSizeInBytes > 0)
                  resolve({
                    code: 0,
                    data: null,
                    msg: "",
                  });
              });

            pipeline(downloadStream, fileWriterStream);
          } catch (error) {
            resolve(goterr(error));
          }
        });
      };

      /**
       * Call HTTP/HTTPS DOWNLOAD
       * @alias module:gotfetch.removefile
       * @param {Object} param - Data in object type.
       * @param {Object} param.file - The physical file
       * @returns {Object} - The result return with property (code, data, msg)
       */
      lib.removefile = (...args) => {
        return new Promise(async (resolve) => {
          try {
            let [param] = args;
            fs.unlinkSync(param.file);
            resolve({ code: 0, data: null, msg: "" });
          } catch (error) {
            resolve(goterr(error));
          }
        });
      };

      /**
       * Call HTTP/HTTPS RESTFUL API base on method definantion
       * @alias module:gotfetch.request
       * @param {Object} param - Data in object type.
       * @param {Object} param.data - Data in json format
       * @param {Object} param.headers - HTTP headers
       * @param {Object} param.method - RESTFUL API
       * @param {Number} param.timeout - Abort the wating responding time from web server.
       * @param {String} param.url - The URL for Web API or web server
       * @returns {Object} - The result return with property (code, data, msg)
       */
      lib.request = (...args) => {
        return new Promise(async (resolve) => {
          try {
            const abortController = new AbortController();
            let [param] = args;
            if (!param?.["method"]) {
              resolve({
                code: -100,
                data: null,
                msg: "Undefine request method!",
              });
            }
            let options = gotoption(Object.assign(param));

            if (param?.["timeout"]) {
              options["signal"] = abortController.signal;
              setTimeout(() => {
                abortController.abort();
              }, param["timeout"]);
            }

            let output = await got(options).json();
            resolve(output);
          } catch (error) {
            resolve(goterr(error));
          }
        });
      };

      /**
       * Call HTTP/HTTPS UPLOAD
       * @alias module:gotfetch.upload
       * @param {Object} param - Data in object type.
       * @param {Object} param.data - Data in json format
       * @param {Object} param.headers - HTTP headers
       * @param {Number} param.timeout - Abort the wating responding time from web server.
       * @param {String} param.url - The URL for Web API or web server
       * @returns {Object} - The result return with property (code, data, msg)
       */
      lib.upload = (...args) => {
        return new Promise(async (resolve) => {
          const [param] = args;
          const { file, data, ...other } = param;
          let output = handler.dataformat;
          try {
            const abortController = new AbortController();
            if (!file) throw new Error("Undefined file path and file name");
            let formdata = new FormData();
            formdata.append("smfetch_upload", fs.createReadStream(file));

            if (data) jsonToFormData(data, {}, formdata);
            let options = gotoption(Object.assign({ method: "POST" }, other));

            if (options.headers) {
              for (let keyname of Object.keys(options.headers)) {
                let value = options.headers[keyname].toLowerCase();
                if (value == "multipart/form-data")
                  delete options.headers[keyname];
              }
            }
            if (Object.keys(options.headers).length == 0)
              delete options.headers;

            options.body = formdata;

            if (options["timeout"]) {
              options["signal"] = abortController.signal;
              setTimeout(() => {
                abortController.abort();
              }, options["timeout"]);
            }

            let rtn = await got(options);
            output.data = rtn.body;
          } catch (error) {
            output = goterr(error);
          } finally {
            resolve(output);
          }
        });
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
