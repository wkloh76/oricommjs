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
 * A module which handle all transaction wih sqlite3 database
 * @module src_sqlite3
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const sqlite3 = require("better-sqlite3");
    const { fs, path, logger } = sys;
    const {
      utils: { datatype, handler, errhandler },
    } = library;
    try {
      let conn = {};
      let lib = {};
      let sqlmanager;
      let dblog = {};
      let registered = {};

      class clsSQLiteDB {
        constructor(connection, dbname, fn) {
          if (!connection)
            throw {
              message: "Connection arguments undefined!",
              stack:
                " Arguments undefined cause clsSQLiteDB rejection the instance class request !.",
            };
          else {
            this._conn = connection;
            this._dbname = dbname;
            this._fn = fn;
          }
        }

        #rules = {
          transaction: false,
          queryone: false,
        };

        #dboption = {
          timeout: 30000,
          namedPlaceholders: false,
          rowsAsArray: false,
          metaAsArray: false,
          nestTables: false,
          dateStrings: true,
          bigIntAsNumber: true,
          decimalAsNumber: false,
        };

        /**
         * Proeduce the sql statement to database with transaction
         * @alias module:sqlite3.clsSQLiteDB.trans
         * @param {...Object} args - 1 parameters
         * @param {String} args[0] - statement is string data in sql statement format.
         */
        trans = async (...args) => {
          let [statements, opt] = args;
          let output = handler.dataformat;
          try {
            output.data = [];
            for (let statement of statements) {
              let query = this._conn.prepare(statement.sql);
              let beginTransaction;
              switch (statement.type) {
                case "INSERT":
                  if (statement.value) {
                    beginTransaction = this._conn.transaction((data) => {
                      let result = { changes: 0, lastInsertRowid: 0 };
                      for (const value of statement.value) {
                        let rtn = query.run(value);
                        result.changes += rtn.changes;
                        result.lastInsertRowid = rtn.lastInsertRowid;
                      }
                      return result;
                    });
                    output.data.push(beginTransaction(statement.value));
                  } else {
                    beginTransaction = this._conn.transaction(() => {
                      return query.run();
                    });
                    output.data.push(beginTransaction());
                  }
                  break;
                case "UPDATE":
                  beginTransaction = this._conn.transaction(() => {
                    return query.run();
                  });
                  output.data.push(beginTransaction());
                  break;
                case "DELETE":
                  beginTransaction = this._conn.transaction(() => {
                    return query.run();
                  });
                  output.data.push(beginTransaction());
                  break;
                case "SELECT":
                  beginTransaction = this._conn.transaction(async () => {
                    return await query.all();
                  });
                  output.data.push(beginTransaction());
                  break;
              }
            }
          } catch (error) {
            output = errhandler(error);
          } finally {
            return output;
          }
        };

        /**
         * Proeduce the sql statement to database without transaction
         * @alias module:sqlite3.clsSQLiteDB.notrans
         * @param {...Object} args - 1 parameters
         * @param {String} args[0] - statement is string data in sql statement format.
         */
        notrans = async (...args) => {
          let [statements, opt] = args;
          let output = handler.dataformat;
          try {
            output.data = [];
            for (let statement of statements) {
              let query = this._conn.prepare(statement.sql);
              switch (statement.type) {
                case "INSERT":
                  output.data.push(query.run());
                  break;
                case "UPDATE":
                  output.data.push(query.run());
                  break;
                case "DELETE":
                  output.data.push(query.run());
                  break;
                case "SELECT":
                  output.data.push(await query.all());
                  break;
              }
            }
          } catch (error) {
            output = errhandler(error);
          } finally {
            return output;
          }
        };

        /**
         * Set a limit 1 into the sql statement and return a row of data(Only for SELECT enquiry)
         * @alias module:sqlite3.clsSQLiteDB.prepare_queryone
         * @param {...Object} args - 1 parameters
         * @param {Object} args[0] - sql is an array of value in sql statement format.
         */
        prepare_queryone = (...args) => {
          let [sql] = args;
          let output = [];
          for (let prepare of sql) {
            let tempsql = prepare.sql.toUpperCase();
            let limit = tempsql.indexOf("LIMIT");
            if (tempsql.indexOf("SELECT") > -1 && limit == -1) {
              let lastIndexOf = prepare.sql.lastIndexOf(";");
              if (lastIndexOf > -1)
                prepare.sql =
                  prepare.sql.substring(0, lastIndexOf) + " LIMIT 1;";
              else prepare.sql = prepare.sql + " LIMIT 1;";
            }
            output.push(prepare);
          }
          return output;
        };

        /**
         * Getter the dboption default value
         * @type {Object}
         * @memberof module:sqlite3.clsSQLiteDB.property.dboption
         * @instance
         */
        get dboption() {
          return structuredClone(this.#dboption);
        }

        /**
         * Getter the rules default value
         * @type {Object}
         * @memberof module:sqlite3.clsSQLiteDB.property.rules
         * @instance
         */
        get rules() {
          return structuredClone(this.#rules);
        }

        /**
         * Disconnect connection
         * @alias module:sqlite3.clsSQLiteDB.disconnect
         * @param {...Object} args - 1 parameter
         * @returns {Null} - Return null
         */
        disconnect = async (...args) => {
          await this._conn.close();
          this._fn(this._dbname);
          this._conn = null;
          return;
        };

        /**
         * Check SQLite3 database is exist
         * @alias module:sqlite3.clsSQLiteDB.isschema
         * @param {...Object} args - 1 parameters
         * @returns {Boolean} - Return true/false
         */
        ischema = (...args) => {
          let [dbname] = args;
          let output = false;
          try {
            let query = this._conn
              .prepare(
                "SELECT COUNT(name) AS counter FROM sqlite_master WHERE type='table';"
              )
              .get();
            if (query.counter > 0) output = true;
          } catch (error) {
            sqlmanager.errlog(error);
          } finally {
            return output;
          }
        };

        /**
         * SQLite3 database executionn sql statement
         * @alias module:sqlite3.clsSQLiteDB.query
         * @param {...Object} args - 1 parameters
         * @param {Object} args[0] - options is decide what kind of output method
         * @param {Object} args[0][write] - write is true the prepare statement for INSERT,UPDATE,DELETE
         * @param {Object} args[0][type] - type different type of slqite3 class statement
         * @param {Object} args[0][cond] - cond get the specific value from query.get and query.all
         * @param {Object} args[0][transaction] - transaction condition:deferred,immediate,exclusive
         * @param {Object} args[1][name] - dbname is db onnection name base on coresetting.ongoing
         * @param {Object} args[1][statement] - statement sql prepare statement
         * @param {Object} args[2] - sqldata is object value for insert table
         *
         * @returns {Object} - Return database result in  object type
         */
        query = async (...args) => {
          let [sql, cond, opt] = args;
          let output = handler.dataformat;
          try {
            if (!cond) cond = this.rules;
            if (!opt) opt = this.dboption;

            if (datatype(sql) != "array") {
              throw {
                code: 10004,
                msg: "The sql parameter is not the array data type! Reject query request.",
              };
            }
            if (cond.queryone) sql = this.prepare_queryone(sql);
            if (cond.transaction) {
              output.data = await this.trans(sql, opt);
            } else {
              output.data = await this.notrans(sql, opt);
              // for (let prepare of sql) {
              //   let statement = { ...prepare, ...opt };
              //   let rtn = await this.notrans(statement);
              //   if (rtn.code == 0) {
              //     if (!output.data) output.data = [];
              //     output.data.push(rtn.data);
              //   } else throw rtn;
              // }
            }
          } catch (error) {
            output = errhandler(error);
            sqlmanager.errlog(error);
          } finally {
            return output;
          }
        };

        /**
         * Imposrt SQLite3 database base on sql file format
         * @alias module:sqlite3.import
         * @param {...Object} args - 1 parameters
         * @param {String} args[0] - dbname is db connection name base on coresetting.ongoing
         * @param {String} args[1] - file is the sql file location
         * @returns {Object} - Return object value which content both connection and schema status
         */
        import = (...args) => {
          let [file] = args;
          let output = handler.dataformat;
          try {
            if (fs.existsSync(file)) {
              let sql = fs.readFileSync(file, "utf8");
              this._conn.exec(sql);
            } else {
              output.code = 10001;
              output.msg = "Cannot found the file for impoort!";
            }
          } catch (error) {
            output.code = 10002;
            output.msg = "SQLite3 import failure:SQL file format wrong!";
            sqlmanager.errlog(error);
          } finally {
            return output;
          }
        };

        /**
         * backup SQLite3 database and save to file
         * @alias module:sqlite3.backup
         * @param {...Object} args - 1 parameters
         * @param {String} args[0] - dbname is db connection name base on coresetting.ongoing
         * @param {String} args[1] - file is the sql file location to save
         * @returns {Object} - Return object value which content both connection and schema status
         */
        backup = async (...args) => {
          let [file] = args;
          let output = handler.dataformat;
          try {
            if (!fs.existsSync(file)) await this._conn.backup(file);
          } catch (error) {
            output.code = 10003;
            output.msg =
              "SQLite3 backup failure:File already exits or path and folder permission issue!";
            sqlmanager.errlog(error);
          } finally {
            return output;
          }
        };
      }

      /**
       * Destroy the deactive connection Id in the module cache
       * @alias module:sqlite3.terminator
       * @param {...Object} args - 1 parameter
       *  @param {Integer} args[0] - threadId database connection Id.
       * @returns {Null} - Return null
       */
      const terminator = (...args) => {
        let [dbname] = args;
        if (conn[dbname]) {
          conn[dbname].disconnect();
          delete conn[dbname];
        }
        return;
      };

      /**
       * Establish SQLite3 database connection or create database if no exist
       * @alias module:sqlmanager.sqlite3.connect
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - log is logger which will save sql prepare statement into log file
       * @param {String} args[1] - db is db engine
       * @param {String} args[2] - dbname is db onnection name base on coresetting.ongoing
       * @returns {Object} - Return object value which content process status
       */
      const connect = async (...args) => {
        let [dbname, compname] = args;
        let output = handler.dataformat;
        try {
          if (registered[compname][dbname]) {
            let db = registered[compname][dbname];
            let options = {};
            let rtn;
            let logpath = db.path;
            if (db.path == "")
              logpath = path.join(
                cosetting.logpath,
                db.engine,
                `${dbname}.db3`
              );

            if (dblog[dbname])
              options.verbose = (message) => {
                dblog[dbname].info(message);
              };
            if (db.type == "file") rtn = await new sqlite3(logpath, options);
            else rtn = await new sqlite3(":memory:", options);
            if (!rtn)
              throw {
                message: "newschema execution failure!",
                stack:
                  " newschema execution failure!better-sqlite3 return undefind.",
              };

            output.data = new clsSQLiteDB(rtn, dbname, terminator);

            if (!conn[dbname]) conn[dbname] = output.data;
          }
          return output;
        } catch (error) {
          return errhandler(error);
        }
      };

      /**
       * Register database pre-connection to the engine by on coresetting.toml defination
       * @alias module:sqlite3.register
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - db is an object type of mariadb database connection setting
       * @param {String} args[1] - dbname is db onnection name base on coresetting.ongoing
       * @param {String} args[2] - compname is the components project naming
       * @returns {Object} - Return object value which content process status
       */
      lib["register"] = async (...args) => {
        let [db, dbname, compname] = args;
        let output = handler.dataformat;
        try {
          if (!registered[compname]) registered[compname] = {};
          let { ...dbconf } = db;
          registered[compname][dbname] = dbconf;
          let rtn = await connect(dbname, compname);
          if (!rtn.code == 0) {
            delete registered[compname][dbname];
          } else rtn.data.disconnect();
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * Create sql stamenet logger
       * @alias module:sqlite3.createlog
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - cosetting is an object value from global variable coresetting
       * @param {Object} args[1] - path is a module from node_modules
       * @returns {Object} - Return value in object type
       */
      lib["createlog"] = async (...args) => {
        let [engine, setting] = args;
        let { db, log } = setting;
        try {
          sqlmanager = engine;
          let output = handler.dataformat;
          let err;
          for (let [key, val] of Object.entries(db)) {
            let { ...dbconf } = val;
            dbconf["engine"] = "sqlite3";
            let rtn = await sqlmanager.setuplog(log, dbconf, key);
            if (!dblog[key]) dblog[key] = rtn.data;
            if (rtn.code !== 0) {
              delete dblog[key];
              err += `The ${key}.log sql statement log file create failure!`;
            }
          }
          if (err) throw { message: "Failure to create log file!", stack: err };

          return output;
        } catch (error) {
          return errhandler(error);
        }
      };

      /**
       * Establish databas connection base on registered setting
       * @alias module:mariadb.connector
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - dbname is db onnection name base on coresetting.ongoing
       * @param {String} args[1] - compname is the components project naming
       * @returns {Object} - Return value in object type which embed db connection module
       */
      lib["connector"] = (...args) => {
        return new Promise(async (resolve) => {
          let [dbname, compname] = args;
          let output = handler.dataformat;
          try {
            let dbarr = Object.keys(registered[compname]);
            if (!dbarr.includes(dbname)) {
              if (registered[compname][dbname]) {
                if (!output.data) output.data = {};
                let rtn = await connect(key, compname);
                if (rtn.code == 0) output.data[key] = rtn.data;
              } else
                throw {
                  code: 10004,
                  msg: "Unmatching database connection name compare with coresetting.ongoiong setting!",
                };
            } else {
              if (!output.data) output.data = {};
              if (conn[dbname]) output.data[dbname] = conn[dbname];
              else {
                let rtn = await connect(dbname, compname);
                if (rtn.code == 0) output.data[dbname] = rtn.data;
              }
            }
          } catch (error) {
            output = errhandler(error);
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
