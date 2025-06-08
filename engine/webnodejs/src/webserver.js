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
    const { datatype, dir_module } = library.utils;
    const { existsSync } = sys.fs;
    const { join } = sys.path;

    const express = require("express");
    const sqlite3 = require("libsql");
    const router = express.Router();
    const bodyParser = require("body-parser");
    const flash = require("connect-flash");
    const cookieParser = require("cookie-parser");
    const expsession = require("express-session");
    const SqliteStore = require("better-sqlite3-session-store")(expsession);
    const compression = require("compression");
    try {
      let lib = {};
      let app = require("express")();
      let sessionval;
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
       * @alias module:webserver.onError
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - error is an object with throw by http service.
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
       * Web server establish and session log
       * @alias module:webserver.establish
       * @param {...Object} args - 2 parameters
       * @param {Object} args[0] - setting is coresetting object value
       * @returns {Object} - Return null | error object
       */
      const establish = (...args) => {
        let [setting] = args;
        try {
          let {
            logpath,
            webnodejs: { parser, session, helmet },
            general,
          } = setting;
          let { savestore, store, verbose, ...setsession } = session;

          //set up our express application
          app.use(require("cors")());
          // app.use(require("helmet")(helmet));
          // Setup server log
          // app.use(sys.loghttp);
          // parse various different custom JSON types as JSON
          app.use(bodyParser.json(parser.json));

          app.use(bodyParser.urlencoded(parser.urlencoded));
          // parse some custom thing into a Buffer
          app.use(bodyParser.raw(parser.raw));
          // parse an HTML body into a string
          app.use(bodyParser.text(parser.text));

          if (savestore) {
            let dbfile;
            if (store.path == "") dbfile = join(logpath, "./sessions.db3");
            else dbfile = join(store.path, "./sessions.db3");
            delete store.path;
            if (verbose)
              store.client = new sqlite3(dbfile, { verbose: console.log });
            else {
              store.client = new sqlite3(dbfile);
              console.log("Session db run silently!");
            }
            setsession.store = new SqliteStore(store);
          }
          sessionval = setsession;
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
          return;
        } catch (error) {
          return error;
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
        let { static: expstatic } = express;
        let atomic = dir_module(share, excludefile);
        for (let atomic_items of atomic) {
          let units = dir_module(join(share, atomic_items), excludefile);
          for (let unit of units) {
            let sharepath = join(share, atomic_items, unit, "src", "browser");
            if (existsSync(sharepath)) {
              obj.app.use(
                `/atomic/${atomic_items}/${unit}`,
                expstatic(sharepath)
              );
            }
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
              if (datatype(val) == "object")
                obj.app.use(key, obj.reaction[val.fn]);
              else obj.app.use(key, express.static(val));
            }
          }
        }
      };
      /**
       * Loading atomic, public static files share and establish web server service
       * @alias module:webserver.start
       * @param {...Object} args - 2 parameters
       * @param {Object} args[0] - setting is coresetting object value
       * @param {Object} args[1] - reaction is an module for responding when http client request
       * @returns {Object} - Return null | error object
       */
      lib["start"] = async (...args) => {
        let [setting, reaction] = args;
        try {
          let rtnestablish = establish(setting);
          if (rtnestablish) throw rtnestablish;
          await Promise.all([
            load_atomic(setting.share.atomic, setting.general.excludefile, {
              app,
            }),
            load_pubshare(setting.share.public, setting.general.engine.type, {
              reaction,
              app,
            }),
          ]);
          // Session in the middleware
          app.use(expsession(sessionval));
          app.use(router.use([sys.loghttp, reaction["onrequest"]]));
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
