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
 * ES Module type
 * @module handler
 */
export default await (async () => {
  try {
    let lib = {
      get dataformat() {
        return Object.assign(
          {},
          {
            code: 0,
            msg: "",
            data: null,
          }
        );
      },
      get fmtseries() {
        return Object.assign(
          {},
          {
            err: [],
            func: {},
            share: {},
          }
        );
      },
      get wfwseries() {
        return Object.assign(
          {},
          {
            error: "",
            func: "",
            name: "",
            param: [],
            pull: [],
            push: [],
          }
        );
      },
      get winevents() {
        return Object.assign(
          {},
          {
            drag: {
              dragend: {},
              dragenter: {},
              dragleave: {},
              dragover: {},
              dragstart: {},
              drop: {},
            },
            events: {
              change: {},
              input: {},
              load: {},
              resize: {},
              reset: {},
              submit: {},
            },
            focus: {
              blur: {},
              focus: {},
              focusin: {},
              focusout: {},
            },
            mouse: {
              click: {},
              contextmenu: {},
              dbclick: {},
              down: {},
              enter: {},
              leave: {},
              out: {},
              over: {},
              up: {},
            },
            keyboard: {
              keydown: {},
              keypress: {},
              keyup: {},
            },
          }
        );
      },
    };
    return lib;
  } catch (error) {
    return error;
  }
})();
