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
    const { events, fs, path, logger } = sys;
    const {
      app,
      BrowserWindow,
      dialog,
      ipcMain,
      net,
      protocol,
      screen,
    } = require("electron");
    const { minify } = require("html-minifier-terser");
    const url = require("url");
    const {
      utils: { datatype },
    } = library;

    try {
      let lib = {};
      let winlist = [];
      let reglist = {};
      let reaction;

      let status = "init";
      let registry = { el: "deskelectron", winshare: {} };
      let myemitter = new events.EventEmitter();

      class clsResponse {
        constructor(channel, fn) {
          this.channel = channel;
          this.fn = fn;
        }

        #response = {
          locals: {},
          status: function (...args) {
            return this;
          },
          end: function (...args) {},

          json: function (url) {
            return;
          },
          redirect: function (url) {
            return;
          },
          send: function (url) {
            myemitter.emit("init", "data", url);
            switch (status) {
              case "init":
                status = "window";
                break;

              case "window":
                break;
            }

            return this;
          },
          setHeader: function (...args) {
            return;
          },
          text: function (...args) {
            return;
          },
        };
      }

      // let clientparams = {
      //   request: {
      //     body: {},
      //     query: {},
      //     params: {},
      //     originalUrl: "",
      //   },
      //   response: {
      //     locals: {},
      //     setHeader: function (...args) {
      //       return;
      //     },
      //     status: function (...args) {
      //       return this;
      //     },
      //     redirect: function (url) {
      //       console.log(url);
      //       return;
      //     },
      //     json: function (url) {
      //       console.log(url);
      //       return;
      //     },
      //     send: function (url) {
      //       myemitter.emit("init", "data", url);
      //       switch (status) {
      //         case "init":
      //           status = "window";
      //           break;

      //         case "window":
      //           break;
      //       }

      //       return this;
      //     },
      //     end: function (...args) {},
      //   },
      // };

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

      const onfetch = (...args) => {
        return new Promise(async (resolve) => {
          let [event, request] = args;
          let output;
          try {
            let fn;
            let response = {
              locals: {},
              setHeader: function (...args) {
                return;
              },
              status: function (...args) {
                return this;
              },
              redirect: function (url) {
                console.log(url);
                return;
              },
              json: async function (data) {
                let renderer = {
                  baseUrl: request.baseUrl,
                  render: {
                    status: 200,
                    statusText: "OK",
                    options: { json: data },
                  },
                };
                let result = fn.apply(null, [renderer]);
                if (result instanceof Promise) {
                  result = await result;
                }
                resolve(output);
              },
              send: async function (url) {
                let result = fn.apply(null, [url]);
                if (result instanceof Promise) {
                  result = await result;
                  if (result instanceof ReferenceError) throw result;
                }
                resolve(output);
              },
              end: function (...args) {
                return;
              },
            };

            function window(url) {
              myemitter.emit("init", "data", url);
              return;
            }

            function resfetch(data) {
              if (request.async) {
                event.reply(`resfetchapi`, data);
                return;
              } else output = [null, data];
              return;
            }

            switch (request.channel) {
              case "init":
                fn = window;
                break;
              case "deskfetch":
              case "deskfetchsync":
                fn = resfetch;
                if (!request.param) request.params = {};
                break;
            }

            let result = reaction["onrequest"](request, response);
            if (result instanceof Promise) {
              result = await result;
              if (result instanceof ReferenceError) throw result;
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
          general,
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
                let filePath = request.url.slice(`${registry.el}://`.length);
                filePath = filePath.slice(host.length);
                let fp = "";
                for (let [key, val] of Object.entries(registry.winshare)) {
                  if (pathname.indexOf(key) > -1) {
                    if (datatype(val) == "object") {
                      fp = val.filepath;
                      joinstr = filePath
                        .split(cosetting.splitter)
                        .slice(-1)
                        .pop();
                    } else {
                      fp = val;
                      joinstr = filePath.slice(key.length);
                    }
                    break;
                  }
                }

                let api = url.pathToFileURL(path.join(fp, joinstr)).toString();
                if (fs.existsSync(path.join(fp, joinstr)))
                  return await net.fetch(api);
              } else {
                // console.log("other origin---", request.url);
                // return;
              }
            } catch (error) {}
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
              preload: path.join(pathname, "browser", "./init.js"),
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
              // protocol.unhandle(winopt.el)
              break;
            default:
              win.loadFile(path.join(pathname, "browser", "./main.html"));
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
            lib.destroy(win.id - 1);
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

          win.once("ready-to-show", () => {
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
       * Configure log module for webexpress and normal log
       * @alias module:webserver.start
       * @param {...Object} args - 2 parameters
       * @param {Object} args[0] - setting is coresetting object value
       * @param {Object} args[1] - onrequest is a function for responding when http client request
       * @returns {Object} - Return null | error object
       */
      lib["start"] = (...args) => {
        return new Promise(async (resolve) => {
          let [setting, obj] = args;
          let { deskelectronjs, ongoing, share } = setting;
          reaction = obj;
          try {
            let { winshare } = registry;
            if (setting.share) {
              for (let share of setting.share) {
                for (let [key, val] of Object.entries(share)) {
                  if (key == "/atomic") {
                    let atomic = library.utils.dir_module(
                      share[key],
                      setting.genernalexcludefile
                    );
                    for (let atomic_items of atomic) {
                      let units = library.utils.dir_module(
                        path.join(share[key], atomic_items),
                        setting.genernalexcludefile
                      );
                      for (let unit of units) {
                        let sharepath = path.join(
                          share[key],
                          atomic_items,
                          unit,
                          "src",
                          "browser"
                        );
                        if (sys.fs.existsSync(sharepath)) {
                          // winshare[units] = sharepath;
                          winshare[units] = {
                            checkpoint: path.join(atomic_items, unit),
                            filepath: sharepath,
                          };
                        }
                      }
                    }
                  } else winshare[key] = val;
                }
              }
            }

            register({ event: "on", channel: "deskfetch" }, onfetch);
            register({ event: "handle", channel: "deskfetchsync" }, onfetch);

            myemitter.once("init", async (render, data) => {
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
