/**
 * Copyright (c) 2025   Loh Wah Kiang
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
 * Submodule handles the http server, which uses hono to manage http requests and responses
 * @module src_webserver
 */

const { Hono } = require("hono");
const { OpenAPIHono, createRoute, z } = require("@hono/zod-openapi");
const { swaggerUI } = require("@hono/swagger-ui");
const { sql: sqlite3, serve } = require("bun");

module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { datatype, dir_module } = library.utils;
    const { existsSync } = sys.fs;
    const { join } = sys.path;

    try {
      let lib = {};
      let app = new OpenAPIHono();

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

          //   //set up our express application
          //   app.use(require("cors")());
          //   // app.use(require("helmet")(helmet));
          //   // Setup server log
          //   app.use(sys.loghttp);
          //   // parse various different custom JSON types as JSON
          //   app.use(bodyParser.json(parser.json));

          //   app.use(bodyParser.urlencoded(parser.urlencoded));
          //   // parse some custom thing into a Buffer
          //   app.use(bodyParser.raw(parser.raw));
          //   // parse an HTML body into a string
          //   app.use(bodyParser.text(parser.text));

          //   // Compress all route
          //   app.use(compression());
          //   if (savestore) {
          //     let dbfile;
          //     if (store.path == "") dbfile = join(logpath, "./sessions.db3");
          //     else dbfile = join(store.path, "./sessions.db3");
          //     delete store.path;
          //     if (verbose)
          //       store.client = new sqlite3(dbfile, { verbose: console.log });
          //     else {
          //       store.client = new sqlite3(dbfile);
          //       console.log("Session db run silently!");
          //     }
          //     setsession.store = new SqliteStore(store);
          //   }

          //   app.use(expsession(setsession));
          //   app.use(cookieParser(setsession.secret));

          //   app.use(flash()); // use connect-flash for flash messages stored in session

          //   app.set(
          //     "port",
          //     normalizePort(process.env.PORT || general.portlistener)
          //   );

          const webservice = () => {
            let output;
            try {
              serve({ fetch: app.fetch, port: general.portlistener });
              return;
            } catch (error) {
              output = error;
            } finally {
              return output;
            }
          };
          //   app.on("error", onError);

          let rtn = webservice();
          if (rtn)
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
          //   await Promise.all([
          //     load_atomic(setting.share.atomic, setting.genernalexcludefile, {
          //       app,
          //     }),
          //     load_pubshare(setting.share.public, setting.general.engine.type, {
          //       reaction,
          //       app,
          //     }),
          //   ]);
          //   app.use(router.use(reaction["onrequest"]));
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
