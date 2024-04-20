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
    const [pathname, curdir] = args;
    const express = require("express");
    const router = express.Router();
    const bodyParser = require("body-parser");
    const flash = require("connect-flash");
    const cookieParser = require("cookie-parser");
    const expsession = require("express-session");
    try {
      let lib = {};

      let app = require("express")();
      let appon = false;
      let flag_request = false;

      /**
       * Normalize the port
       * @alias module:webapp.normalizePort
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
            process.exit(1);
            break;
          case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
            break;
          default:
            throw error;
        }
      };

      /**
       * Event listener for HTTP server "listening" event.
       * @alias module:webapp.onListening
       */
      const onListening = () => {
        let addr = app.server.address();
        let bind =
          typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
      };

      /**
       * Express server establish
       * @alias module:webapp.establish
       */
      const establish = (...args) => {
        try {
          let [setting] = args;
          let {
            webnodejs: { parser, session, helmet },
            general,
          } = setting;

          //set up our express application
          app.use(require("cors")());
          app.use(require("helmet")(helmet));
          // Setup server log
          app.use(sysmodule.loghttp);
          // parse various different custom JSON types as JSON
          app.use(bodyParser.json(parser.json));

          app.use(bodyParser.urlencoded(bodyParser.urlencoded));
          // parse some custom thing into a Buffer
          app.use(bodyParser.raw(bodyParser.raw));
          // parse an HTML body into a string
          app.use(bodyParser.text(bodyParser.text));

          app.use(expsession(session));
          app.use(cookieParser(session.secret));

          app.use(flash()); // use connect-flash for flash messages stored in session

          app.set(
            "port",
            normalizePort(process.env.PORT || general.portlistener)
          );

          app.server = app.listen(general.portlistener);
          app.on("error", onError);
          app.on("listening", onListening);
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

      const routing = (...args) => {
        try {
          let [objs, onrequest] = args;
          for (let obj of objs) {
            for (let [key, val] of Object.entries(obj)) {
              let method = val["method"].toLowerCase();
              router[method](key, onrequest);
            }
          }
          return;
        } catch (error) {
          return error;
        }
      };

      const sharing = (...args) => {
        try {
          let [obj] = args;
          for (let [key, val] of Object.entries(obj)) {
            app.use(key, express.static(val));
            // app.use(key, val);
          }
          return;
        } catch (error) {
          return error;
        }
      };

      lib["start"] = (...args) => {
        try {
          let [setting, component, onrequest] = args;
          let rtnestablish;
          if (!appon) {
            appon = true;
            rtnestablish = establish(setting);
          }
          if (!rtnestablish) {
            sharing(setting.share);
            routing(component, onrequest);
          } else throw rtnestablish;

          return;
        } catch (error) {
          return error;
        }
      };

      lib["end"] = (...args) => {
        try {
          let [onrequest] = args;
          if (!flag_request) {
            flag_request = true;
            router.use(onrequest);
            app.use(router);
          }
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
