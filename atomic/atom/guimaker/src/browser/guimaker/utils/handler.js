"use strict";

/**
 * ES Module type
 * @module manager
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
          }
        );
      },
    };
    return lib;
  } catch (error) {
    return error;
  }
})();
