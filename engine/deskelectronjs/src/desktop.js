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
 * The submodule of init_electron
 * @module src_desktop
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const {
      arr_diffidx,
      datatype,
      dir_module,
      errhandler,
      handler,
      intercomm,
    } = library.utils;
    const { existsSync } = sys.fs;
    const { join } = sys.path;

    const {
      app,
      BrowserWindow,
      dialog,
      ipcMain,
      net,
      protocol,
      screen,
      session,
    } = require("electron");
    const { minify } = require("html-minifier-terser");
    const url = require("url");
    const crypto = require("crypto");

    try {
      let lib = {};
      let winlist = [];
      let reglist = {};
      let reaction, sessopt, ses, cache;
      let registry = { el: "deskelectron", winshare: {} };

      ipcMain.handle("validate-session", async () => {
        const [cookie] = await session.defaultSession.cookies.get({
          name: "electron_session",
        });
        if (!cookie || cookie.expirationDate * 1000 <= Date.now()) {
          await session.defaultSession.clearStorageData();
          winlist[0].webContents.send("session-expired");
          return false;
        }
        return true;
      });

      const register = (...args) => {
        let [config, fn] = args;
        ipcMain[config.event](config.channel, fn);
        reglist[config.channel] = fn;
      };

      const unregister = (...args) => {
        try {
          let [url] = args;
          ipcMain.removeListener(url, reglist[url]);
        } catch (error) {
          return error;
        }
      };

      const unregisters = (...args) => {
        try {
          for (const [key, value] of Object.entries(reglist)) {
            ipcMain.removeAllListeners(key);
          }
        } catch (error) {
          return error;
        }
      };

      // Add object to session storage
      const add_session = async (key, value) => {
        try {
          ses.cookies.remove("http://localhost", key);
          await ses.cookies.set({
            url: `http://localhost`,
            name: key,
            value: JSON.stringify(value),
            expirationDate:
              Math.floor(Date.now() / 1000) + sessopt.expireAfterSeconds,
            httpOnly: sessopt.cookieOptions.httpOnly,
            secure: sessopt.encryptionKey,
          });
        } catch (error) {
          console.log(error);
        }
      };

      // Retrieve object from session
      const get_session = async (key) => {
        let [data] = await ses.cookies.get({
          url: `http://localhost`,
          name: key,
        });
        return data;
      };

      const remove_session = async (key) => {
        try {
          ses.cookies.remove("http://localhost", key);
          cache = undefined;
        } catch (error) {
          console.log(error);
        }
      };
      // Add object to session storage
      const renew_session = async (key, value) => {
        try {
          let extract = {};
          for (let [k, v] of Object.entries(value)) {
            if (
              !"domain expirationDate hostOnly httpOnly name path sameSite secure session"
                .split(" ")
                .includes(k)
            )
              extract[k] = v;
          }
          ses.cookies.remove("http://localhost", key);
          await ses.cookies.set({
            url: `http://localhost`,
            name: key,
            value: JSON.stringify(extract),
            expirationDate:
              Math.floor(Date.now() / 1000) + sessopt.expireAfterSeconds,
            httpOnly: sessopt.cookieOptions.httpOnly,
            secure: sessopt.encryptionKey,
          });
        } catch (error) {
          console.log(error);
        }
      };

      const update_session = async (...args) => {
        const [key, sess_data] = args;
        let output = handler.dataformat;
        try {
          let sess = await get_session(key);
          if (sess && sess_data) {
            let result = arr_diffidx(Object.keys(sess_data), Object.keys(sess));
            if (result.data.length > 0) {
              let extraData = {};
              for (let v of result.data)
                if (v.from == "source") extraData[v.value] = sess_data[v.value];
              await add_session("session_data", extraData);
            }
          }
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      const onfetch = (...args) => {
        return new Promise(async (resolve) => {
          let [event, request] = args;

          let ses_data = await get_session("session_data");
          if (!ses_data && !cache) {
            await add_session("session_data", {});
            request["session"] = {
              ...(await get_session("session_data")),
              clear_session: function () {
                remove_session("session_data");
                return;
              },
            };
            delete request["session"].value;
          } else if (!ses_data && cache) {
            await renew_session("session_data", cache);
            ses_data = await get_session("session_data");
            let extract = JSON.parse(ses_data.value);
            request["session"] = ses_data;
            delete request["session"].value;
            request["session"] = {
              ...request["session"],
              ...extract,
              clear_session: function () {
                remove_session("session_data");
                return;
              },
            };
            cache = undefined;
          } else {
            let extract = JSON.parse(ses_data.value);
            request["session"] = ses_data;
            delete request["session"].value;
            request["session"] = {
              ...request["session"],
              ...extract,
              clear_session: function () {
                remove_session("session_data");
                return;
              },
            };
          }

          try {
            let ans;
            let response = {
              locals: {},
              setHeader: function (...args) {
                return;
              },
              status: function (...args) {
                return this;
              },
              redirect: async function (url, sess) {
                let session = {};
                if (Object.keys(sess).length != 0) session = { ...sess };
                let result = await reaction["onredirect"](
                  {
                    originalUrl: url,
                    params: {},
                    session,
                  },
                  response
                );
                if (result instanceof Promise) {
                  result = await result;
                  if (result instanceof ReferenceError) throw result;
                }

                reroute(sess, result.data);
                await update_session("session_data", sess);
                return;
              },
              json: async function (data) {
                ans = {
                  baseUrl: request.baseUrl,
                  render: {
                    status: 200,
                    statusText: "OK",
                    options: { json: data },
                  },
                };
                return;
              },
              send: async function (url, sess) {
                intercomm.fire("deskinit", ["data", url]);
                await update_session("session_data", sess);
                return;
              },
              rendererr: async function (url, sess) {
                reroute(sess, url);
                await update_session("session_data", sess);
                return;
              },
              end: function (...args) {
                return;
              },
            };

            switch (request.channel) {
              case "deskfetch":
              case "deskfetchsync":
                if (!request.param) request.params = {};
                break;
            }

            let result = reaction["onrequest"](request, response);
            if (result instanceof Promise) {
              result = await result;
              if (result instanceof ReferenceError) throw result;
            }

            if (ans) {
              if (request.channel == "deskfetch") {
                result = null;
                event.reply(`resfetchapi`, ans);
                resolve();
              } else resolve([null, ans]);
            }
          } catch (error) {
            resolve(error);
          }
        });
      };
      /**
       * Initialize
       * @alias module:window.init
       * @param {...Object} args - 0 parameters
       * @returns
       */
      const init = async (...args) => {
        try {
          app.removeAllListeners("ready");
          app.removeAllListeners("window-all-closed");
          app.removeAllListeners("activate");
          await app.whenReady();
          app.on("window-all-closed", () => {
            console.log("Electron client quitting!");
            if (process.platform !== "darwin") {
              app.quit();
            }
          });

          protocol.registerSchemesAsPrivileged([
            {
              scheme: `${registry.el}`,
              privileges: {
                standard: true,
                secure: true,
                supportFetchAPI: true,
              },
            },
          ]);

          return;
        } catch (error) {
          return error;
        }
      };

      const reroute = (sess, data) => {
        let output = handler.dataformat;
        try {
          if (winlist.length == 0) new Error("Cannot find current window!!");
          let htmlstring = `data:text/html;charset=UTF-8,${encodeURIComponent(
            data
          )}`;
          winlist[0].webContents.loadURL(htmlstring, {
            baseURLForDataURL: `${registry.el}://resource/`,
          });
          cache = sess;
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * Loading atomic public share modules for frontend use
       * @alias module:webserver.load_atomic
       * @param {...Object} args - 3 parameters
       * @param {Object} args[0] - share is an object
       * @param {Array} args[1] - excludefile content a list of data for ignore purpose
       * @param {Object} args[2] - obj is an object of module which content app module
       * @returns {Object} - Return null | error object
       */
      const load_atomic = (...args) => {
        let [share, excludefile, obj] = args;
        let atomic = dir_module(share, excludefile);
        for (let atomic_items of atomic) {
          let units = dir_module(join(share, atomic_items), excludefile);
          for (let unit of units) {
            let sharepath = join(share, atomic_items, unit, "src", "browser");
            if (existsSync(sharepath))
              obj[unit] = {
                checkpoint: `${atomic_items}/${unit}`,
                filepath: sharepath,
              };
          }
        }
      };

      /**
       * Allocate public static files share
       * @alias module:webserver.load_pubshare
       * @param {...Object} args - 3 parameters
       * @param {Object} args[0] - share is an object
       * @param {String} args[1] - enginetype is value which content the engine type
       * @param {Object} args[2] - obj is an object of module which content reaction and app modules
       * @returns {Object} - Return null | error object
       */
      const load_pubshare = (...args) => {
        let [share, enginetype, obj] = args;
        for (let [pubkey, pubval] of Object.entries(share)) {
          if (pubkey.indexOf(`${enginetype}_`) > -1) {
            for (let [key, val] of Object.entries(pubval)) {
              obj[key] = val;
            }
          }
        }
      };

      /**
       * Establish new browser window
       * @alias module:desktop.establish
       * @param {...Object} args - 1 parameters
       * @param {Array} args[0] - winopt modules - new window configuration data
       * @returns
       */
      const establish = async (...args) => {
        let [setting] = args;
        let {
          deskelectronjs: { window: winopt },
        } = setting;
        try {
          let monwidth = "";
          let monheight = "";
          let { width, height } = screen.getPrimaryDisplay().workAreaSize;
          if (width > winopt.width) monwidth = width;
          if (height > winopt.height) monheight = height;

          const resource = async (...args) => {
            let [request] = args;
            try {
              let { host, pathname } = new URL(request.url);
              if (pathname !== "/") {
                let joinstr = "";
                let apicontent = "";
                let fp = "";
                let filePath = request.url.slice(`${registry.el}://`.length);
                filePath = filePath.slice(host.length);

                for (let [key, val] of Object.entries(registry.winshare)) {
                  if (pathname.indexOf(key) > -1) {
                    if (datatype(val) == "object") {
                      fp = val.filepath;
                      if (val.content) {
                        apicontent = val.content;
                        joinstr = filePath.replace(`/${val.checkpoint}/`, "");
                      } else {
                        let startpos = pathname.indexOf(val.checkpoint);
                        joinstr = pathname.substring(
                          startpos + val.checkpoint.length
                        );
                      }
                    } else {
                      fp = val;
                      joinstr = filePath.slice(key.length);
                    }
                    break;
                  }
                }

                let api = url.pathToFileURL(join(fp, joinstr)).toString();
                if (existsSync(join(fp, joinstr))) {
                  if (apicontent !== "") {
                    let less = await net.fetch(api);
                    apicontent += await less.text();
                    apicontent = await minify(apicontent, {
                      collapseWhitespace: true,
                    });
                    return new Response(apicontent);
                  } else return await net.fetch(api);
                }
              } else {
                // console.log("other origin---", request.url);
                // return;
              }
            } catch (error) {
              console.log(error);
            }
          };

          protocol.handle(`${registry.el}`, resource);

          const win = new BrowserWindow({
            title: winopt.APP_NAME,
            autoHideMenuBar: winopt.autoHideMenuBar,
            width: monwidth,
            height: monheight,
            frame: winopt.frame,
            fullscreen: winopt.fullscreen,
            useContentSize: winopt.useContentSize,
            resizable: winopt.resizable,
            show: winopt.show,
            webPreferences: {
              nodeIntegration: winopt.nodeIntegration,
              contextIsolation: winopt.contextIsolation,
              enableRemoteModule: winopt.enableRemoteModule,
              nodeIntegrationInWorker: true,
              webSecurity: winopt.webSecurity,
              preload: join(pathname, "browser", "./init.js"),
            },
          });

          win.webContents.session.webRequest.onBeforeSendHeaders(
            (details, callback) => {
              callback({
                requestHeaders: { Origin: "*", ...details.requestHeaders },
              });
            }
          );

          win.webContents.session.webRequest.onHeadersReceived(
            (details, callback) => {
              callback({
                responseHeaders: {
                  "access-control-allow-origin": ["*"],
                  ...details.responseHeaders,
                },
              });
            }
          );

          switch (winopt.render) {
            case "url":
              win.loadURL(winopt.html);
              break;
            case "file":
              win.loadFile(winopt.html);
              break;
            case "data":
              let htmlstring = `data:text/html;charset=UTF-8,${encodeURIComponent(
                winopt.html
              )}`;
              win.loadURL(htmlstring, {
                baseURLForDataURL: `${registry.el}://resource/`,
              });
              break;
            default:
              win.loadFile(join(pathname, "browser", "./main.html"));
          }

          win.on("close", async (e) => {
            e.preventDefault(); // Prevent default no matter what.

            const { response } = await dialog.showMessageBox(win, {
              type: "question",
              buttons: ["Yes", "No"],
              title: "Confirm",
              message: "Are you sure you want to quit?",
            });

            response === 0 && win.destroy();
          });

          win.on("closed", () => {
            dismantle(win.id - 1);
          });

          win.on("error", (error) => {
            ipcRenderer.send("browser", {
              code: 0,
              msg: "",
              data: {
                event: "error",
                err: error,
              },
            });
          });

          win.once("ready-to-show", async () => {
            win.show();
            if (winopt.openDevTools) win.webContents.openDevTools();

            function UpsertKeyValue(obj, keyToChange, value) {
              const keyToChangeLower = keyToChange.toLowerCase();
              for (const key of Object.keys(obj)) {
                if (key.toLowerCase() === keyToChangeLower) {
                  // Reassign old key
                  obj[key] = value;
                  // Done
                  return;
                }
              }
              // Insert at end instead
              obj[keyToChange] = value;
            }
          });

          win.webContents.on("did-finish-load", () => {
            win.webContents.send("browser", {
              code: 0,
              msg: "",
              data: {
                event: "did-finish-load",
                id: win.id,
                name: winopt.name,
              },
            });
          });
          winlist.push(win);
        } catch (error) {
          return error;
        }
      };

      /**
       * Dismantle selected window
       * @alias module:desktop.dismantle
       * @param {...Object} args - 1 parameters
       * @param {Array} args[0] - win integer - the window id
       * @returns
       */
      const dismantle = (...args) => {
        let [win] = args;
        let idx = winlist.indexOf(win);
        if (idx > -1) winlist.splice(idx, 1);
      };

      /**
       * Configure log module for webexpress and normal log
       * @alias module:desktop.start
       * @param {...Object} args - 2 parameters
       * @param {Object} args[0] - setting is coresetting object value
       * @param {Object} args[1] - onrequest is a function for responding when http client request
       * @returns {Object} - Return null | error object
       */
      lib["start"] = (...args) => {
        return new Promise(async (resolve) => {
          let [setting, obj] = args;
          let { deskelectronjs } = setting;
          let { reaction: reactionjs, autoupdate } = obj;
          reaction = reactionjs;
          sessopt = setting.deskelectronjs.session;

          try {
            let ongoing;
            if (setting.args.project && setting.args.project != "")
              ongoing = setting.ongoing[setting.args.project];
            else {
              let ongoing_names = Object.keys(setting.ongoing);
              ongoing_names.map((value, idx) => {
                if (value.indexOf(`${setting.general.engine.type}_`) == -1)
                  ongoing_names.splice(idx, 1);
              });
              if (ongoing_names.length > 0) {
                let [dname] = ongoing_names;
                ongoing = structuredClone(setting.ongoing[dname]);
              }
            }

            await Promise.all([
              load_atomic(
                setting.share.atomic,
                setting.genernalexcludefile,
                registry.winshare
              ),
              load_pubshare(
                setting.share.public,
                setting.general.engine.type,
                registry.winshare
              ),
            ]);

            register({ event: "on", channel: "deskfetch" }, onfetch);
            register({ event: "handle", channel: "deskfetchsync" }, onfetch);

            intercomm.register("deskinit", "once", async (render, data) => {
              try {
                deskelectronjs.window.render = render;
                deskelectronjs.window.html = data;
                let result = establish(setting);
                if (result instanceof Promise) {
                  result = await result;
                  if (result instanceof ReferenceError) throw result;
                }
                await init();
                resolve();
              } catch (error) {
                resolve(error);
              }
            });

            intercomm.register("desktopcast", "always", async (...args) => {
              let [param, tabindex = 0] = args;
              if (winlist.length > 0)
                winlist[tabindex].webContents.send("broadcast", param);
            });

            await autoupdate.init(setting);
            ses = session.fromPartition("persist:my-session");
            await onfetch(null, {
              method: "GET",
              originalUrl: ongoing.defaulturl,
              channel: "init",
              body: {},
              query: {},
              params: {},
            });
          } catch (error) {
            resolve(error);
          }
        });
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
