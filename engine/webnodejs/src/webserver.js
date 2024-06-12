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
 * Submodule handles the http server, which uses expressJS to manage http requests and responses
 * @module src_webserver
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const express = require("express");
    const sqlite3 = require("better-sqlite3");
    const router = express.Router();
    const bodyParser = require("body-parser");
    const flash = require("connect-flash");
    const cookieParser = require("cookie-parser");
    const expsession = require("express-session");
    const SqliteStore = require("better-sqlite3-session-store")(expsession);
    try {
      let lib = {};
      let app = require("express")();

      /**
       * Normalize the port
       * @alias module:webserver.normalizePort
       */
      const normalizePort = (val) => {
        let port = parseInt(val, 10);

        if (isNaN(port)) {
          // named pipe
          return val;
        }

        if (port >= 0) {
          // port number
          return port;
        }

        return false;
      };

      /**
       * Event listener for HTTP server "error" event.
       * @alias module:webapp.onError
       * @param {Object} error - As an object with throw by http service.
       */
      const onError = (...args) => {
        let [error] = args;
        if (error.syscall !== "listen") {
          throw error;
        }

        let bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
          case "EACCES":
            console.error(bind + " requires elevated privileges");
            break;
          case "EADDRINUSE":
            console.error(bind + " is already in use");
            break;
          default:
        }
        throw error;
      };

      /**
       * Express server establish
       * @alias module:webserver.establish
       */
      const establish = (...args) => {
        let [setting] = args;

        try {
          let {
            webnodejs: { parser, session, helmet },
            general,
          } = setting;
          let { savestore, store, ...setsession } = session;

          //set up our express application
          app.use(require("cors")());
          // app.use(require("helmet")(helmet));
          // Setup server log
          app.use(sys.loghttp);
          // parse various different custom JSON types as JSON
          app.use(bodyParser.json(parser.json));

          app.use(bodyParser.urlencoded(parser.urlencoded));
          // parse some custom thing into a Buffer
          app.use(bodyParser.raw(parser.raw));
          // parse an HTML body into a string
          app.use(bodyParser.text(parser.text));

          if (savestore) {
            let dbfile;
            if (store.path == "") dbfile = "./sessions.db3";
            else dbfile = sys.path.join(store.path, "./sessions.db3");
            delete store.path;
            store.client = new sqlite3(dbfile, { verbose: console.log });
            setsession.store = new SqliteStore(store);
          }

          app.use(expsession(setsession));
          app.use(cookieParser(setsession.secret));

          app.use(flash()); // use connect-flash for flash messages stored in session

          app.set(
            "port",
            normalizePort(process.env.PORT || general.portlistener)
          );

          app.on("error", onError);
          app.server = app.listen(general.portlistener);
          if (!app.server.address())
            throw {
              errno: -4,
              message: `address already in use :::${general.portlistener}`,
              stack: `The port number ${general.portlistener} occupied by other service!`,
            };
          else return;
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
        try {
          let [setting, onrequest] = args;
          let rtnestablish = establish(setting);
          if (rtnestablish) throw rtnestablish;

          if (setting.share) {
            for (let [key, val] of Object.entries(setting.share)) {
              if (key == "/atomic") {
                let atomic = library.utils.dir_module(
                  setting.share[key],
                  setting.genernalexcludefile
                );
                for (let atomic_items of atomic) {
                  let units = library.utils.dir_module(
                    sys.path.join(setting.share[key], atomic_items),
                    setting.genernalexcludefile
                  );
                  for (let unit of units) {
                    let sharepath = sys.path.join(
                      setting.share[key],
                      atomic_items,
                      unit,
                      "src",
                      "browser"
                    );
                    if (sys.fs.existsSync(sharepath))
                      app.use(
                        sys.path.join(key, atomic_items, unit),
                        express.static(sharepath)
                      );
                  }
                }
              } else app.use(key, express.static(val));
            }
          }

          app.use(router.use(onrequest));
          return;
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
