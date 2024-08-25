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
 * ES submodule of guimaker
 * @module interface
 */
export default await (async () => {
  let library, sys;
  const { default: reaction } = await import(`./reaction.js`);
  try {
    let lib = {
      reaction,
      load: (...args) => {
        const [kernel, sysmodule] = args;
        library = kernel;
        sys = sysmodule;
        reaction.load(library, sys);
      },
    };
    return lib;
  } catch (error) {
    return error;
  }
})();
