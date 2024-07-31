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
 * The submodule of utils
 * @module utils_handler
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [pathname, curdir] = args;
    const util = require("util");
    const os = require("os");
    const cwdexec = util.promisify(require("child_process").exec);
    const execFile = util.promisify(require("child_process").execFile);
    try {
      const dataformat = {
        code: 0,
        msg: "",
        data: null,
      };
      const execrtn = {
        error: null,
        stdout: null,
        stderr: null,
        ok: true,
        code: 0,
      };
      let userid = null;
      let lib = {
        /**
         * Getter the user id
         * @type {String}
         * @memberof module:exec
         * @instance
         */
        get getuid() {
          return userid;
        },
      };

      /**
       * Check current user in linux os.
       * @alias module:exec.getuid
       * @returns {Object } - Return current user.
       */
      lib["initial"] = () => {
        return new Promise(async (resolve, reject) => {
          let output = structuredClone(dataformat);
          try {
            if (os.type() == "Linux") {
              let rtn = await lib.shell(
                "id | awk '{print $1}' | sed 's/.*(//;s/)$//'"
              );
              userid = rtn.data.stdout.trim();
              output.data = {
                userid: userid,
              };
              resolve(output);
            } else {
              userid = null;
              resolve(output);
            }
          } catch (error) {
            output.code = -1;
            output.msg = error.message;
            output.data = error;
            resolve(output);
          }
        });
      };

      /**
       * Execute linux command line with non privilege.
       * @alias module:exec.shell
       * @param {String} cmd - Accept multi command line with non privilege.
       * @param {String} dir - Set to a specific working directory for a specific command line.
       * @returns {Object } - Return value which is return from the linux terminal.
       */
      lib["shell"] = (...params) => {
        return new Promise(async (resolve, reject) => {
          let [cmd, dir] = params;
          let cmdobject = structuredClone(execrtn),
            result = structuredClone(dataformat);
          try {
            let proc = [cmd];
            if (dir) proc.push({ cwd: dir });
            const { error, stdout, stderr } = await cwdexec.apply(null, proc);
            cmdobject.error = error;
            cmdobject.stdout = stdout;
            cmdobject.stderr = stderr;

            if (error) {
              cmdobject.ok = false;
              cmdobject.code = -2;
            } else cmdobject.error = null;
            result.code = 0;
            result.data = cmdobject;
            resolve(result);
          } catch (error) {
            result.code = -1;
            result.msg = error.message;
            result.data = error;
            resolve(result);
          }
        });
      };

      /**
       * Executes an external application linux command line with non privilege.
       * @alias module:exec.shellfile
       * @param {String} cmd - Accept single command line execute file with non privilege.
       * @param {String} args - Arguments.
       * * @param {String} opt - Set to a specific working directory for a specific command line.
       * @returns {Object } - Return value which is return from the linux terminal.
       */
      lib["shellfile"] = (...params) => {
        return new Promise(async (resolve, reject) => {
          let [cmd, args, opt] = params;
          let cmdobject = structuredClone(execrtn),
            result = structuredClone(dataformat);
          try {
            let proc = [cmd, args];
            if (opt) proc.push(opt);

            const { error, stdout, stderr } = await execFile.apply(null, proc);
            cmdobject.error = error;
            cmdobject.stdout = stdout;
            cmdobject.stderr = stderr;

            if (error) {
              cmdobject.ok = false;
              cmdobject.code = -2;
            } else cmdobject.error = null;
            result.code = 0;
            result.data = cmdobject;
            resolve(result);
          } catch (error) {
            result.code = -1;
            result.msg = error.message;
            result.data = error;
            resolve(result);
          }
        });
      };

      /**
       * Execute linux command line with privilege.
       * @alias module:exec.sudoshell
       * @param {String} pwd - Linux user password.
       * @param {String} cmd - Accept multi command line with privilege.
       * @param {String} dir - Set to a specific working directory for a specific command line.
       * @returns {Object } - Return value which is return from the linux terminal.
       */
      lib["sudoshell"] = (...params) => {
        return new Promise(async (resolve, reject) => {
          let [pwd, cmd, dir] = params;
          let cmdobject = structuredClone(execrtn),
            result = structuredClone(dataformat);
          try {
            let proc = [`echo ${pwd} | sudo -S ${cmd}`];
            if (dir) proc.push({ cwd: dir });
            const { error, stdout, stderr } = await cwdexec.apply(null, proc);
            cmdobject.error = error;
            cmdobject.stdout = stdout;
            cmdobject.stderr = stderr;

            if (error) {
              cmdobject.ok = false;
              cmdobject.code = -2;
            } else cmdobject.error = null;
            result.code = 0;
            result.data = cmdobject;
            resolve(result);
          } catch (error) {
            result.code = -1;
            result.msg = error.message;
            result.data = error;
            resolve(result);
          }
        });
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
