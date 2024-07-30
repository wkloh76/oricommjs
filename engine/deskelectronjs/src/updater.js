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
 * The submodule of auto update execute program
 * @module src_updater
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { fs, path, yaml } = sys;
    const { app } = require("electron");
    const logger = require("electron-log");
    const util = require("util");
    const os = require("os");
    const { default: got } = await import("got");
    const stream = require("stream");
    const crypto = require("crypto");
    const ini = require("ini");

    try {
      let { createWriteStream } = fs;
      let pipeline = util.promisify(stream.pipeline);
      let cwdexec = util.promisify(require("child_process").exec);

      let addHeader = { headers: {} };
      let sudo, tout, appupdater, packagetype, softwarepack;
      let lib = {};

      /**
       * Handle error throw by got module
       * @alias module:autoupdate.goterr
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

      const restartservice = async (...args) => {
        let [packagejson] = args;
        try {
          let { name } = packagejson;
          let restart = `systemctl --user restart ${name}.service`;
          await cwdexec(restart);
        } catch (error) {
          logger.error(["restart service error!", error.message]);
        }
      };
      const newservice = async (...args) => {
        let [setting, updater] = args;
        let { packagejson, splitter, args: arg } = setting;
        try {
          let { name, productName } = packagejson;
          let { systemd } = updater;
          let servicepath = path.join(splitter, "etc", "systemd", systemd);
          if (!fs.existsSync(path.join(servicepath, `${name}.service`))) {
            let servicetemp = ini.parse(
              fs.readFileSync(
                path.join(pathname, "updater", "service.template"),
                "utf-8"
              )
            );
            servicetemp.Unit.Description = productName;
            let ExecStart = `${name} --mode=${arg.mode} --engine=${arg.engine}`;
            servicetemp.Service.ExecStart = ExecStart;
            let service = ini
              .stringify(servicetemp)
              .replace(`ExecStart="${ExecStart}"`, `ExecStart=${ExecStart}`);

            fs.writeFileSync(
              path.join(splitter, "tmp", `${name}.service`),
              service
            );

            let mv = `${sudo}mv ${path.join(
              splitter,
              "tmp",
              `${name}.service`
            )} ${path.join(splitter, "etc", "systemd", "user")}`;
            let enservice = `systemctl --user enable ${name}.service`;
            let glbservice = `${sudo}systemctl --global enable ${name}.service`;
            await cwdexec(mv);
            await cwdexec(enservice);
            await cwdexec(glbservice);
          }
        } catch (error) {
          logger.error(["new service error!", error.message]);
        }
      };

      const install = async () => {
        try {
          let cmd = `${sudo}dpkg -i ${softwarepack} > /dev/null`;
          await cwdexec(cmd);
        } catch (error) {
          logger.error(["Install error!", error.message]);
        }
      };

      const checksum = (algorithm = "sha512", fpath) => {
        return new Promise(async (resolve, reject) => {
          let shasum = crypto.createHash(algorithm);
          let fd = fs.ReadStream(fpath);
          fd.on("error", (error) => {
            resolve();
          })
            .on("data", (data) => {
              shasum.update(data);
            })
            .on("end", () => {
              resolve(shasum.digest("base64"));
            });
        });
      };

      const download = async (...args) => {
        return new Promise(async (resolve, reject) => {
          try {
            let [param] = args;
            let options = {
              url: `${param.url}${param.path}`,
              headers: {
                ...addHeader.headers,
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                // "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language":
                  "en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3",
                "Cache-Control": "max-age=0",
                Connection: "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "User-Agent":
                  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
              },
            };

            let tagname = `/tmp/${param.path}`;
            let downloadStream = got.stream(options);
            let fileWriterStream = createWriteStream(tagname);

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
                else resolve({ code: 0, data: { file: tagname }, msg: "" });
              })
              .on("finish", () => {
                let stats = fs.statSync(tagname);
                let fileSizeInBytes = stats.size;
                if (fileSizeInBytes > 0) {
                  resolve({
                    code: 0,
                    data: { file: tagname },
                    msg: "",
                  });
                }
              });

            pipeline(downloadStream, fileWriterStream);
          } catch (error) {
            resolve(goterr(error));
          }
        });
      };

      const get_arch = () => {
        let rtn = "";
        switch (os.arch()) {
          case "x32":
            rtn = "i386";
            break;

          case "x64":
            rtn = "amd64";
            break;

          case "arm":
            rtn = "armhf";
            break;

          case "arm64":
            rtn = "arm64";
            break;
        }
        return rtn;
      };

      const get_latestversion = async (...args) => {
        let [splitter] = args;
        let output = { code: 0, msg: "", data: null };
        try {
          let abortController = new AbortController();
          let options = {
            method: "GET",
            ...addHeader,
            url: `${appupdater.url}${splitter}latest-linux.yml`,
            signal: abortController.signal,
          };

          setTimeout(() => {
            abortController.abort();
          }, 10000);

          output.data = yaml.parse(await got(options).text());
          return output;
        } catch (error) {
          logger.error(["Check latest version error!", error.message]);
          return goterr(error);
        }
      };

      const check_update = async (...args) => {
        let [setting, updater] = args;
        let { packagejson, splitter } = setting;
        try {
          let { name, productName, version } = packagejson;
          let arch = `${get_arch()}.${packagetype}`;

          logger.info("Checked for updates");
          let rtn = await get_latestversion(splitter);

          if (rtn.code == 0) {
            let [dname, dver, darch] = rtn.data.path.split("_");
            let intversion = Number(version.replace(/[^0-9]/g, ""));
            let intdver = Number(dver.replace(/[^0-9]/g, ""));

            if (name == dname && arch == darch && intdver > intversion) {
              logger.info(
                `${productName} latest release version is ${dver}, the software currently version is ${version}. Will download and upgrade silently!`
              );
              let { files, ...doptions } = rtn.data;
              let fdownload = await download({
                url: appupdater.url,
                ...doptions,
              });
              if (fdownload.code == 0) {
                softwarepack = fdownload.data.file;
                let csum = await checksum("sha512", softwarepack);
                if (csum && csum == rtn.data.sha512) {
                  await install();
                  await newservice(setting, updater);
                  await restartservice(packagejson);
                  app.exit(0);
                }
              } else logger.error("Download failure!", fdownload.msg);
              console.log(done);
            } else
              logger.info(
                `${productName} currently version is ${dver}, no updates available in this moment.`
              );
          }

          resolve(rtn);
        } catch (error) {
          resolve(goterr(error));
        }
      };

      const whoami = async (...args) => {
        let [general] = args;
        try {
          let { sudopwd } = general;
          let output = "";
          let { stdout } = await cwdexec("echo $(whoami)");
          if (stdout.trim() != "root") output = `echo ${sudopwd} | sudo -S `;

          return output;
        } catch (e) {}
      };

      lib.init = async (...args) => {
        let [setting] = args;
        let {
          deskelectronjs: {
            updater: { auth, cyclecheck, delay, silent, systemd },
            updater,
          },
          general,
          packagejson: { name },
          packagejson,
          splitter,
        } = setting;

        //print log to logger
        logger.transports.file.maxSize = 1002430; // 10M
        logger.transports.file.format =
          "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}";

        logger.transports.file.resolvePathFn = () =>
          path.join(app.getPath("appData"), "logs", "eupdater.log");

        sudo = await whoami(general);
        if (auth !== undefined && auth != "") {
          addHeader.headers["Authorization"] = auth;
        }

        let appupdatepath = path.join(
          library.dir.substring(0, library.dir.lastIndexOf("resources")),
          "resources",
          "app-update.yml"
        );

        let packagetypepath = path.join(
          library.dir.substring(0, library.dir.lastIndexOf("resources")),
          "resources",
          "package-type"
        );

        if (fs.existsSync(appupdatepath))
          appupdater = yaml.parse(fs.readFileSync(appupdatepath, "utf8"));
        if (fs.existsSync(packagetypepath))
          packagetype = yaml.parse(fs.readFileSync(packagetypepath, "utf8"));

        // If no service then create
        if (appupdater && packagetype) {
          let servicepath = path.join(splitter, "etc", "systemd", systemd);
          if (!fs.existsSync(path.join(servicepath, `${name}.service`))) {
            await newservice(setting, updater);
            await restartservice(packagejson);
            app.exit(0);
          }
        }

        tout = setTimeout(async () => {
          if (appupdater !== undefined && packagetype !== undefined) {
            await check_update(setting, updater);
            clearTimeout(tout);
            tout = setTimeout(async () => {
              clearTimeout(tout);
              await check_update(setting, updater);
            }, cyclecheck * 1000);
          }
        }, delay * 1000);
      };

      resolve(lib);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
};
