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
 * @module src_browser_init
 */
(() => {
  // Disable SCP warning
  process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = true;
  const { contextBridge, ipcRenderer } = require("electron");

  let wait_callback = {};

  let decodeapi = (...args) => {
    let [event, param] = args;
    let { baseUrl, render } = param;
    try {
      let fn = wait_callback[baseUrl];
      if (render.status == 200) {
        if (fn?.success) {
          fn.success.apply(null, [
            render.status,
            render.statusText,
            render.options.json,
          ]);
        }
      } else {
        if (fn?.error) {
          render.status;
          fn.error.apply(null, [
            render.status,
            render.statusText,
            render.options.json,
          ]);
        }
      }
      delete wait_callback[baseUrl];
      return [render.status, render.statusText, render.options.json];
    } catch (error) {
      console.log(error.message);
      return [-1, error.message, null];
    }
  };

  ipcRenderer.on("resfetchapi", decodeapi);
  ipcRenderer.on("broadcast", (...args) => {
    let [event, param] = args;
    const emit = new CustomEvent("intercom", {
      detail: param,
    });
    document.dispatchEvent(emit);
  });

  contextBridge.exposeInMainWorld("electron", () => {
    return {
      chrome: process.versions.chrome,
      node: process.versions.node,
      electron: process.versions.electron,
    };
  });

  contextBridge.exposeInMainWorld("fetchapi", {
    request: async (...args) => {
      try {
        let [param] = args;
        let { async, success, error, ...req } = param;

        if (wait_callback?.[req.originalUrl] === undefined) {
          wait_callback[req.originalUrl] = { count: 0 };
          req.baseUrl = req.originalUrl;
        } else {
          let count = parseInt(wait_callback[req.originalUrl]["count"]) + 1;
          wait_callback[req.originalUrl]["count"] = count;

          req.baseUrl = `${req.originalUrl}-${
            wait_callback[req.originalUrl]["count"]
          }`;

          wait_callback[req.baseUrl] = {};
        }

        if (success) wait_callback[req.baseUrl]["success"] = success;
        if (error) wait_callback[req.baseUrl]["error"] = error;
        req["async"] = async;

        if (async) {
          req["channel"] = "deskfetch";
          ipcRenderer.send("deskfetch", req);
        } else {
          req["channel"] = "deskfetchsync";
          return decodeapi.apply(
            null,
            await ipcRenderer.invoke("deskfetchsync", req)
          );
        }
      } catch (error) {
        console.log(error.message);
      }
    },
  });

  window.addEventListener("DOMContentLoaded", async () => {});
})();
