"use strict";
/**
 * ES Module type
 * The detail refer tohttps://cdn.jsdelivr.net/npm/@sagold/json-pointer@6.0.1/dist/jsonPointer.min.js
 * @module jspointer
 */
export default await (() => {
  "use strict";
  var e = {
      d: (t, n) => {
        for (var r in n)
          e.o(n, r) &&
            !e.o(t, r) &&
            Object.defineProperty(t, r, { enumerable: !0, get: n[r] });
      },
      o: (e, t) => Object.prototype.hasOwnProperty.call(e, t),
      r: (e) => {
        "undefined" != typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module",
          }),
          Object.defineProperty(e, "__esModule", { value: !0 });
      },
    },
    t = {};
  function n(e) {
    return "#" === e || "" === e || (Array.isArray(e) && 0 === e.length) || !1;
  }
  e.r(t),
    e.d(t, {
      default: () => _,
      get: () => s,
      isRoot: () => n,
      join: () => P,
      remove: () => v,
      removeUndefinedItems: () => m,
      set: () => g,
      split: () => f,
      splitLast: () => O,
    });
  const r = /~1/g,
    o = /~0/g,
    i = /(^#?\/?)/g;
  function l(e) {
    return e.replace(r, "/").replace(o, "~");
  }
  function u(e) {
    return l(decodeURIComponent(e));
  }
  function f(e) {
    if (null == e || "string" != typeof e || n(e))
      return Array.isArray(e) ? e : [];
    const t = e.indexOf("#") >= 0 ? u : l,
      r = (e = e.replace(i, "")).split("/");
    for (let e = 0, n = r.length; e < n; e += 1) r[e] = t(r[e]);
    return r;
  }
  function s(e, t, r = void 0) {
    if (null == t || null == e) return r;
    if (n(t)) return e;
    const o = c(e, f(t));
    return void 0 === o ? r : o;
  }
  function c(e, t) {
    const n = t.shift();
    if (void 0 !== e) return void 0 !== n ? c(e[n], t) : e;
  }
  const p = /^\[.*\]$/,
    d = /^\[(.+)\]$/;
  function a(e, t) {
    return (
      "__proto__" === e ||
      ("constructor" == e && t.length > 0 && "prototype" == t[0])
    );
  }
  function g(e, t, n) {
    if (null == t) return e;
    const r = f(t);
    if (0 === r.length) return e;
    null == e && (e = p.test(r[0]) ? [] : {});
    let o,
      i,
      l = e;
    for (; r.length > 1; )
      (o = r.shift()), (i = p.test(r[0])), a(o, r) || (l = h(l, o, i));
    return (o = r.pop()), y(l, o, n), e;
  }
  function y(e, t, n) {
    let r;
    const o = t.match(d);
    "[]" === t && Array.isArray(e)
      ? e.push(n)
      : o
      ? ((r = o.pop()), (e[r] = n))
      : (e[t] = n);
  }
  function h(e, t, n) {
    if (null != e[t]) return e[t];
    const r = n ? [] : {};
    return y(e, t, r), r;
  }
  function m(e) {
    let t = 0,
      n = 0;
    for (; t + n < e.length; )
      void 0 === e[t + n] && (n += 1), (e[t] = e[t + n]), (t += 1);
    return (e.length = e.length - n), e;
  }
  function v(e, t, n) {
    const r = f(t),
      o = r.pop(),
      i = s(e, r);
    return i && delete i[o], Array.isArray(i) && !0 !== n && m(i), e;
  }
  const j = /~/g,
    b = /\//g;
  function A(e, t) {
    if (0 === e.length) return t ? "#" : "";
    for (let n = 0, r = e.length; n < r; n += 1)
      (e[n] = e[n].replace(j, "~0").replace(b, "~1")),
        t && (e[n] = encodeURIComponent(e[n]));
    return (t ? "#/" : "/") + e.join("/");
  }
  function P(e, ...t) {
    const n = [];
    if (Array.isArray(e)) return A(e, !0 === arguments[1]);
    const r = arguments[arguments.length - 1],
      o = "boolean" == typeof r ? r : e && "#" === e[0];
    for (let e = 0, t = arguments.length; e < t; e += 1)
      n.push.apply(n, f(arguments[e]));
    const i = [];
    for (let e = 0, t = n.length; e < t; e += 1)
      if (".." === n[e]) {
        if (0 === i.length) return o ? "#" : "";
        i.pop();
      } else i.push(n[e]);
    return A(i, o);
  }
  function O(e) {
    const t = f(e);
    if (0 === t.length)
      return "string" == typeof e && "#" === e[0] ? ["#", t[0]] : ["", void 0];
    if (1 === t.length) return "#" === e[0] ? ["#", t[0]] : ["", t[0]];
    const n = t.pop();
    return [P(t, "#" === e[0]), n];
  }
  const _ = {
    get: s,
    set: g,
    remove: v,
    join: P,
    split: f,
    splitLast: O,
    isRoot: n,
    removeUndefinedItems: m,
  };
  return t;
})();
