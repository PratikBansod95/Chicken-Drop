(function() {
    let e = document.createElement(`link`).relList;
    if (e && e.supports && e.supports(`modulepreload`))
        return;
    for (let e of document.querySelectorAll(`link[rel="modulepreload"]`))
        n(e);
    new MutationObserver(e => {
        for (let t of e)
            if (t.type === `childList`)
                for (let e of t.addedNodes)
                    e.tagName === `LINK` && e.rel === `modulepreload` && n(e)
    }
    ).observe(document, {
        childList: !0,
        subtree: !0
    });
    function t(e) {
        let t = {};
        return e.integrity && (t.integrity = e.integrity),
        e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
        e.crossOrigin === `use-credentials` ? t.credentials = `include` : e.crossOrigin === `anonymous` ? t.credentials = `omit` : t.credentials = `same-origin`,
        t
    }
    function n(e) {
        if (e.ep)
            return;
        e.ep = !0;
        let n = t(e);
        fetch(e.href, n)
    }
}
)();
var e = `modulepreload`
  , t = function(e) {
    return `/` + e
}
  , n = {}
  , r = function(r, i, a) {
    let o = Promise.resolve();
    if (i && i.length > 0) {
        let r = document.getElementsByTagName(`link`)
          , s = document.querySelector(`meta[property=csp-nonce]`)
          , c = s?.nonce || s?.getAttribute(`nonce`);
        function l(e) {
            return Promise.all(e.map(e => Promise.resolve(e).then(e => ({
                status: `fulfilled`,
                value: e
            }), e => ({
                status: `rejected`,
                reason: e
            }))))
        }
        o = l(i.map(i => {
            if (i = t(i, a),
            i in n)
                return;
            n[i] = !0;
            let o = i.endsWith(`.css`)
              , s = o ? `[rel="stylesheet"]` : ``;
            if (a)
                for (let e = r.length - 1; e >= 0; e--) {
                    let t = r[e];
                    if (t.href === i && (!o || t.rel === `stylesheet`))
                        return
                }
            else if (document.querySelector(`link[href="${i}"]${s}`))
                return;
            let l = document.createElement(`link`);
            if (l.rel = o ? `stylesheet` : e,
            o || (l.as = `script`),
            l.crossOrigin = ``,
            l.href = i,
            c && l.setAttribute(`nonce`, c),
            document.head.appendChild(l),
            o)
                return new Promise( (e, t) => {
                    l.addEventListener(`load`, e),
                    l.addEventListener(`error`, () => t(Error(`Unable to preload CSS for ${i}`)))
                }
                )
        }
        ))
    }
    function s(e) {
        let t = new Event(`vite:preloadError`,{
            cancelable: !0
        });
        if (t.payload = e,
        window.dispatchEvent(t),
        !t.defaultPrevented)
            throw e
    }
    return o.then(e => {
        for (let t of e || [])
            t.status === `rejected` && s(t.reason);
        return r().catch(s)
    }
    )
}
  , i = `[playabl/sdk]`
  , a = `playabl.ai`
  , o = `/Runtime-Script/sdk/v1/version.json`
  , s = /\.(dev|staging)\.playabl\.ai$/
  , c = `https://cdn.playabl.ai/Runtime-Script/sdk/v1/runtime.js`;
function l(e) {
    return e === `local` || e === `dev` || e === `staging` || e === `prod`
}
function u(e=typeof window < `u` ? window.location.hostname : ``, t=typeof window < `u` ? window.location.search : ``) {
    let n = new URLSearchParams(t).get(`env`);
    if (l(n))
        return n;
    if (e === `localhost` || e === `127.0.0.1`)
        return `local`;
    let r = e.match(s);
    return r ? r[1] : `prod`
}
function d(e) {
    return `https://${e === `prod` ? `cdn` : `cdn-${e}`}.${a}${o}`
}
async function f(e={}) {
    if (e.runtimeUrl)
        return e.runtimeUrl;
    let t = u();
    if (!e.manifestUrl && t === `local`)
        return c;
    let n = e.manifestUrl ?? d(t);
    try {
        let e = await fetch(n, {
            cache: `no-store`
        });
        if (!e.ok)
            throw Error(`manifest HTTP ${e.status}`);
        let t = await e.json();
        if (typeof t.runtimeUrl != `string` || !t.runtimeUrl)
            throw Error(`manifest missing runtimeUrl`);
        return t.runtimeUrl
    } catch (e) {
        return console.warn(`${i} runtime manifest unavailable; using fallback runtime URL`, e),
        c
    }
}
var p = class extends Error {
    code;
    cause;
    constructor(e, t, n) {
        super(t ?? e),
        this.name = `PlayablError`,
        this.code = e,
        this.cause = n
    }
}
, m, h, g, _, v = async () => {
    let e = await f({
        runtimeUrl: m,
        manifestUrl: h
    });
    return (await r( () => import(e), [])).default
}
;
async function y() {
    if (typeof window > `u`)
        throw new p(`SDK_NOT_READY`,`Playabl SDK runtime can only be loaded in a browser.`);
    return g ??= v().then(e => (_ = e,
    e), e => {
        throw g = void 0,
        new p(`SDK_NOT_READY`,`Playabl SDK runtime could not be loaded.`,e)
    }
    ),
    g
}
function b() {
    return _
}
var x = {
    ready: async () => (await y()).ready(),
    leaderboard: {
        submit: async e => (await y()).leaderboard.submit(e)
    },
    gameState: {
        save: async e => (await y()).gameState.save(e),
        load: async () => (await y()).gameState.load(),
        clear: async () => (await y()).gameState.clear()
    },
    tweaks: {
        init: async e => (await y()).tweaks.init(e)
    },
    assets: {
        register: async e => (await y()).assets.register(e)
    },
    device: {
        haptics: {
            isSupported: () => {
                let e = b();
                return e ? e.device.haptics.isSupported() : !1
            }
            ,
            vibrate: async e => (await y()).device.haptics.vibrate(e),
            cancel: async () => (await y()).device.haptics.cancel()
        },
        camera: {
            isSupported: () => {
                let e = b();
                return e ? e.device.camera.isSupported() : !1
            }
            ,
            getStream: async e => (await y()).device.camera.getStream(e),
            capturePhoto: async e => (await y()).device.camera.capturePhoto(e),
            stopStream: () => {
                let e = b();
                e && e.device.camera.stopStream()
            }
        },
        microphone: {
            isSupported: () => {
                let e = b();
                return e ? e.device.microphone.isSupported() : !1
            }
            ,
            getStream: async e => (await y()).device.microphone.getStream(e),
            startRecording: e => {
                let t = b();
                if (!t)
                    throw Error(`Playabl runtime not ready; call sdk.ready() before startRecording()`);
                t.device.microphone.startRecording(e)
            }
            ,
            stopRecording: async () => (await y()).device.microphone.stopRecording(),
            stopStream: () => {
                let e = b();
                e && e.device.microphone.stopStream()
            }
        },
        geolocation: {
            isSupported: () => {
                let e = b();
                return e ? e.device.geolocation.isSupported() : !1
            }
            ,
            getCurrentPosition: async e => (await y()).device.geolocation.getCurrentPosition(e),
            watchPosition: (e, t) => {
                let n = null
                  , r = !1;
                return y().then(i => {
                    r || (n = i.device.geolocation.watchPosition(e, t))
                }
                ),
                () => {
                    r = !0,
                    n && n()
                }
            }
        },
        fileSystem: {
            isSupported: () => {
                let e = b();
                return e ? e.device.fileSystem.isSupported() : !1
            }
            ,
            isLegacySupported: () => {
                let e = b();
                return e ? e.device.fileSystem.isLegacySupported() : !1
            }
            ,
            openFile: async e => (await y()).device.fileSystem.openFile(e),
            saveFile: async (e, t) => (await y()).device.fileSystem.saveFile(e, t),
            readAsText: async e => (await y()).device.fileSystem.readAsText(e),
            readAsDataURL: async e => (await y()).device.fileSystem.readAsDataURL(e)
        },
        sensors: {
            isMotionSupported: () => {
                let e = b();
                return e ? e.device.sensors.isMotionSupported() : !1
            }
            ,
            isOrientationSupported: () => {
                let e = b();
                return e ? e.device.sensors.isOrientationSupported() : !1
            }
            ,
            requestMotionPermission: async () => (await y()).device.sensors.requestMotionPermission(),
            watchMotion: (e, t) => {
                let n = null
                  , r = !1;
                return y().then(i => {
                    r || (n = i.device.sensors.watchMotion(e, t))
                }
                ),
                () => {
                    r = !0,
                    n && n()
                }
            }
            ,
            watchOrientation: e => {
                let t = null
                  , n = !1;
                return y().then(r => {
                    n || (t = r.device.sensors.watchOrientation(e))
                }
                ),
                () => {
                    n = !0,
                    t && t()
                }
            }
        }
    },
    audio: {
        isSupported: () => {
            let e = b();
            return e ? e.audio.isSupported() : !1
        }
        ,
        getContext: async e => (await y()).audio.getContext(e),
        createContext: async e => (await y()).audio.createContext(e)
    }
}
  , S = {
    BOUNCY_OBJECT_ATLAS: `/generated-assets/bouncy_object_atlas-transparent.webp`,
    BOUNCY_OBJECT_FRAMES: `/generated-assets/bouncy_object_atlas-transparent.frames.json`,
    BOUNCY_BACKDROP: `/generated-assets/bouncy_backdrop.webp`
};
function C(e, t, n) {
    try {
        return e?.get?.(t) || n
    } catch {
        return n
    }
}
function w(e) {
    return new Promise( (t, n) => {
        let r = new Image;
        r.decoding = `async`,
        r.onload = () => t(r),
        r.onerror = () => n(Error(`Failed to load ${e}`)),
        r.src = e
    }
    )
}
async function T(e) {
    let t = await fetch(e);
    if (!t.ok)
        throw Error(`Failed to load ${e}`);
    return t.json()
}
async function ee(e) {
    let[t,n,r] = await Promise.all([w(C(e, `BOUNCY_OBJECT_ATLAS`, S.BOUNCY_OBJECT_ATLAS)), T(S.BOUNCY_OBJECT_FRAMES), w(C(e, `BOUNCY_BACKDROP`, S.BOUNCY_BACKDROP))]);
    return {
        atlas: t,
        frames: new Map((n.frames || []).map(e => [e.name, e])),
        backdrop: r
    }
}
function te(e) {
    let t = null
      , n = null
      , r = !1;
    async function i() {
        if (!t)
            try {
                t = await e.audio.getContext(),
                n = t.context
            } catch {
                n = null
            }
    }
    function a(e, t, i=.08, a=`sine`) {
        if (!n || !r)
            return;
        let o = n.currentTime
          , s = n.createOscillator()
          , c = n.createGain();
        s.type = a,
        s.frequency.setValueAtTime(e, o),
        c.gain.setValueAtTime(.001, o),
        c.gain.linearRampToValueAtTime(i, o + .015),
        c.gain.exponentialRampToValueAtTime(.001, o + t),
        s.connect(c).connect(n.destination),
        s.start(o),
        s.stop(o + t + .03)
    }
    async function o(t) {
        try {
            e.device.haptics.isSupported() && await e.device.haptics.vibrate(t)
        } catch {}
    }
    return {
        prepare: i,
        async unlock() {
            await i();
            try {
                await t?.unlock?.()
            } catch {}
            r = !0
        },
        bounce(e=1) {
            a(260 + e * 130, .1, .055 + e * .025, `triangle`)
        },
        collect() {
            a(720, .08, .08, `sine`),
            setTimeout( () => a(940, .08, .065, `sine`), 55)
        },
        crack() {
            a(82, .34, .2, `sawtooth`),
            o([35, 20, 70])
        },
        success() {
            a(540, .11, .09, `sine`),
            setTimeout( () => a(710, .12, .08, `sine`), 95),
            setTimeout( () => a(920, .18, .07, `sine`), 190),
            o([20, 30, 20])
        },
        dispose() {
            t?.dispose?.()
        }
    }
}
var E = {
    width: 1e3,
    height: 1180
}
  , D = [{
    x: 120,
    y: 92
}, {
    x: 840,
    y: 92
}, {
    x: 220,
    y: 150
}, {
    x: 740,
    y: 145
}, {
    x: 500,
    y: 86
}, {
    x: 105,
    y: 245
}, {
    x: 875,
    y: 235
}, {
    x: 360,
    y: 118
}, {
    x: 650,
    y: 118
}, {
    x: 500,
    y: 220
}]
  , O = [{
    x: 830,
    y: 1025
}, {
    x: 170,
    y: 985
}, {
    x: 720,
    y: 890
}, {
    x: 300,
    y: 1040
}, {
    x: 520,
    y: 940
}, {
    x: 880,
    y: 775
}, {
    x: 120,
    y: 830
}, {
    x: 640,
    y: 1060
}, {
    x: 390,
    y: 800
}, {
    x: 760,
    y: 690
}]
  , k = {
    spring: {
        label: `Spring`,
        asset: `spring`,
        w: 84,
        h: 90,
        defaultAngle: 0,
        unlock: 2
    },
    pad: {
        label: `Pad`,
        asset: `bouncy_pad`,
        w: 110,
        h: 62,
        defaultAngle: 0,
        unlock: 4
    },
    fan: {
        label: `Fan`,
        asset: `fan`,
        w: 84,
        h: 92,
        defaultAngle: 0,
        unlock: 8
    },
    conveyor: {
        label: `Belt`,
        asset: `conveyor`,
        w: 145,
        h: 54,
        defaultAngle: 0,
        unlock: 13
    },
    sticky: {
        label: `Sticky`,
        asset: `sticky_zone`,
        w: 135,
        h: 62,
        defaultAngle: 0,
        unlock: 18
    }
};
function A(e) {
    return e * Math.PI / 180
}
function j(e, t, n) {
    return Math.max(t, Math.min(n, e))
}
function M(e, t) {
    return Math.hypot(e.x - t.x, e.y - t.y)
}
function ne(e, t, n) {
    let r = n.x - t.x
      , i = n.y - t.y
      , a = r * r + i * i || 1
      , o = j(((e.x - t.x) * r + (e.y - t.y) * i) / a, 0, 1);
    return Math.hypot(e.x - (t.x + r * o), e.y - (t.y + i * o))
}
function N(e, t, n, r, i, a) {
    let o = [M(e, n) - (t + 170), M(e, r) - (t + 160), ne(e, n, r) - (t + 95), ...i.map(n => M(e, n) - (t + 70)), ...a.map(n => {
        let r = Math.max(n.w || 100, n.h || 70) * .5;
        return M(e, n) - (t + r + 70)
    }
    )];
    return Math.min(...o)
}
function P(e, t, n, r, i, a, o) {
    let s = r.x - n.x
      , c = r.y - n.y
      , l = Math.hypot(s, c) || 1
      , u = {
        x: -c / l,
        y: s / l
    }
      , d = (e + +(t === `pan`)) % 2 ? 1 : -1
      , f = t === `fire` ? .68 : .43
      , p = [0, -.12, .12, -.22, .22]
      , m = [230, 300, 370];
    for (let e of p) {
        let t = j(f + e, .28, .78)
          , l = {
            x: n.x + s * t,
            y: n.y + c * t
        };
        for (let e of [d, -d])
            for (let t of m) {
                let s = {
                    x: j(l.x + u.x * e * t, o + 45, E.width - o - 45),
                    y: j(l.y + u.y * e * t, 300, E.height - o - 90)
                };
                if (N(s, o, n, r, i, a) >= 0)
                    return s
            }
    }
    return null
}
function F(e) {
    let t = {};
    return e >= 2 && (t.spring = 1 + +(e % 5 == 0)),
    e >= 4 && (t.pad = 1 + +(e % 4 == 1)),
    e >= 8 && (t.fan = 1 + +(e % 7 == 0)),
    e >= 13 && (t.conveyor = 1 + +(e % 6 == 0)),
    e >= 18 && (t.sticky = 1 + +(e % 9 == 0)),
    e >= 40 && (t.pad += 1),
    t
}
function I(e, t, n, r={}) {
    return {
        id: `${e}-${t}-${n}-${Math.random().toString(16).slice(2)}`,
        type: e,
        x: t,
        y: n,
        angle: A(r.angle || 0),
        w: r.w,
        h: r.h,
        fixed: !0,
        rotating: !!r.rotating,
        rotateSpeed: A(r.rotateSpeed || 0),
        dir: r.dir || 1
    }
}
function re(e, t, n) {
    let r = k[e];
    return {
        id: `${e}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: e,
        x: t,
        y: n,
        angle: A(r.defaultAngle),
        w: r.w,
        h: r.h,
        fixed: !1
    }
}
function L(e) {
    let t = j(e, 1, 50)
      , n = Math.sin(t * 1.7)
      , r = D[(t - 1) % D.length]
      , i = O[(t * 3 + 1) % O.length]
      , a = Math.floor((t - 1) / D.length)
      , o = {
        x: j(r.x + Math.sin(t * 1.9) * 24 + a * 11, 80, 920),
        y: j(r.y + Math.cos(t * 1.4) * 18 + a * 16, 74, 270)
    }
      , s = {
        x: j(i.x + Math.cos(t * 2.3) * 28 - a * 9, 95, 905),
        y: j(i.y + Math.sin(t * 1.2) * 24 - a * 12, 660, 1070)
    }
      , c = Math.hypot(s.x - o.x, s.y - o.y)
      , l = j(Math.round(c * 1.55 + 260), 1100, 1800)
      , u = [{
        x: 300 + n * 90,
        y: 330 + t % 4 * 35,
        collected: !1
    }, {
        x: 500 - n * 120,
        y: 590 + t % 5 * 30,
        collected: !1
    }, {
        x: 700 + Math.sin(t) * 80,
        y: 800 - t % 4 * 28,
        collected: !1
    }]
      , d = [];
    if (t >= 10 && d.push(I(`spike`, 500 + Math.sin(t) * 220, 965 - t % 4 * 40, {
        w: 140,
        h: 62
    })),
    t >= 24) {
        let e = o.x < E.width * .5;
        d.push(I(`fan`, e ? 90 : 910, 620, {
            angle: e ? 0 : 180,
            w: 82,
            h: 90,
            dir: e ? 1 : -1
        }))
    }
    t >= 30 && d.push(I(`sticky`, 500, 930, {
        w: 160,
        h: 66
    })),
    t >= 38 && d.push(I(`conveyor`, 500, 430, {
        angle: t % 2 ? 6 : -6,
        w: 180,
        h: 50,
        dir: t % 2 ? 1 : -1
    })),
    t >= 44 && (d.push(I(`spike`, 250, 760, {
        w: 120,
        h: 60
    })),
    d.push(I(`spike`, 760, 600, {
        w: 120,
        h: 60
    })));
    let f = P(t, `fire`, o, s, u, d, 60);
    if (f && d.push(I(`fire`, f.x, f.y, {
        w: 118,
        h: 86
    })),
    t >= 3) {
        let e = P(t, `pan`, o, s, u, d, 88);
        e && d.push(I(`pan`, e.x, e.y, {
            angle: t % 2 ? -18 : 18,
            w: 176,
            h: 72,
            rotating: t >= 12,
            rotateSpeed: t % 2 ? 16 : -16
        }))
    }
    return {
        number: t,
        name: `Level ${t}`,
        start: o,
        basket: s,
        stars: u,
        fixedObjects: d,
        tools: F(t),
        parTools: Object.values(F(t)).reduce( (e, t) => e + t, 0),
        inkLimit: l,
        parInk: Math.round(l * .78),
        timeLimit: t < 12 ? 70 : t < 32 ? 62 : 55
    }
}
var R = 24;
function z(e, t, n) {
    return Math.max(t, Math.min(n, e))
}
function B(e, t) {
    let n = Math.hypot(e, t) || 1;
    return {
        x: e / n,
        y: t / n,
        length: n
    }
}
function V(e, t, n, r) {
    let i = r.x - n.x
      , a = r.y - n.y
      , o = i * i + a * a;
    if (o < 1e-4)
        return 1 / 0;
    let s = z(((e - n.x) * i + (t - n.y) * a) / o, 0, 1)
      , c = e - (n.x + i * s)
      , l = t - (n.y + a * s);
    return c * c + l * l
}
function H(e) {
    if (e.a && e.b)
        return {
            ax: e.a.x,
            ay: e.a.y,
            bx: e.b.x,
            by: e.b.y,
            length: Math.hypot(e.b.x - e.a.x, e.b.y - e.a.y)
        };
    let t = e.w || (e.type === `spring` ? 82 : 160)
      , n = Math.cos(e.angle) * t * .5
      , r = Math.sin(e.angle) * t * .5;
    return {
        ax: e.x - n,
        ay: e.y - r,
        bx: e.x + n,
        by: e.y + r,
        length: t
    }
}
function U(e, t, n) {
    let r = H(t)
      , i = r.bx - r.ax
      , a = r.by - r.ay
      , o = z(((e.x - r.ax) * i + (e.y - r.ay) * a) / (r.length * r.length), 0, 1)
      , s = r.ax + i * o
      , c = r.ay + a * o
      , l = B(e.x - s, e.y - c)
      , u = t.type === `line` ? 6 : 2;
    if (l.length >= e.radius + u)
        return null;
    let d = l.x
      , f = l.y;
    l.length < .001 && (d = -a / (r.length || 1),
    f = i / (r.length || 1));
    let p = e.radius + u - Math.max(l.length, .001);
    e.x += d * p,
    e.y += f * p;
    let m = e.vx * d + e.vy * f
      , h = Math.abs(Math.min(0, m));
    if (m < 0) {
        let r = {
            x: -f,
            y: d
        }
          , i = e.vx * r.x + e.vy * r.y
          , a = .22;
        t.type === `pad` && (a = .86 * n.bounceStrength),
        t.type === `spring` && (a = 1.05 * n.bounceStrength),
        t.type === `sticky` && (a = .04);
        let o = t.type === `sticky` ? .25 : t.type === `line` ? .985 : .92;
        e.vx = r.x * i * o - d * m * a,
        e.vy = r.y * i * o - f * m * a,
        t.type === `spring` && (e.vx += d * 390 * n.bounceStrength,
        e.vy += f * 390 * n.bounceStrength),
        t.type === `conveyor` && (e.vx += r.x * 210 * (t.dir || 1),
        e.vy += r.y * 210 * (t.dir || 1))
    }
    return {
        impact: h,
        fragileSurface: ![`spring`, `pad`, `sticky`, `conveyor`].includes(t.type),
        type: t.type
    }
}
function W(e, t, n=0) {
    let r = Math.cos(-t.angle)
      , i = Math.sin(-t.angle)
      , a = e.x - t.x
      , o = e.y - t.y
      , s = a * r - o * i
      , c = a * i + o * r;
    return Math.abs(s) <= (t.w || 100) * .5 + e.radius + n && Math.abs(c) <= (t.h || 60) * .5 + e.radius + n
}
function ie(e, t, n, r) {
    let i = Math.cos(-t.angle)
      , a = Math.sin(-t.angle)
      , o = e.x - t.x
      , s = e.y - t.y
      , c = o * i - s * a
      , l = o * a + s * i;
    if (c < 0 || c > 245 || Math.abs(l) > 105)
        return;
    let u = r.fanStrength * (1 - c / 280);
    e.vx += Math.cos(t.angle) * u * n,
    e.vy += Math.sin(t.angle) * u * n
}
function G(e) {
    return {
        x: e.start.x,
        y: e.start.y,
        vx: 0,
        vy: 0,
        radius: R,
        rotation: -.18,
        broken: !1
    }
}
function ae(e, t, n, r) {
    let i = e.egg;
    i.vy += n.gravity * t;
    let a = [...e.level.fixedObjects, ...e.placedObjects];
    a.forEach(e => {
        e.rotating && (e.angle += e.rotateSpeed * t),
        e.type === `fan` && ie(i, e, t, n),
        e.type === `sticky` && W(i, e, 18) && (i.vx *= 1 - Math.min(.72, t * 3.8),
        i.vy *= 1 - Math.min(.72, t * 3.8))
    }
    ),
    i.x += i.vx * t,
    i.y += i.vy * t,
    i.rotation += i.vx * t * .018;
    for (let e of a) {
        if (e.type === `fan`)
            continue;
        if (e.type === `fire` && W(i, e, -8)) {
            r.fail(`The egg was cooked by the fire.`);
            return
        }
        if (e.type === `pan` && W(i, e, -10)) {
            r.fail(`The frying pan smashed the egg.`);
            return
        }
        if (e.type === `spike` && W(i, e, -4)) {
            r.fail(`The egg hit spikes.`);
            return
        }
        let t = U(i, e, n);
        if (t && (r.bounce(Math.min(1.8, t.impact / 520), e.type, i.x, i.y),
        t.fragileSurface && t.impact > n.impactBreakSpeed)) {
            r.fail(`The egg cracked on impact.`);
            return
        }
    }
    let o = null
      , s = 1 / 0;
    for (let t of e.drawnStrokes)
        for (let e = 1; e < t.points.length; e += 1) {
            let n = t.points[e - 1]
              , r = t.points[e]
              , a = V(i.x, i.y, n, r);
            a < s && (s = a,
            o = {
                type: `line`,
                a: n,
                b: r
            })
        }
    let c = o && s < (i.radius + 6) ** 2 ? U(i, o, n) : null;
    if (c && (r.bounce(Math.min(1.8, c.impact / 520), `line`, i.x, i.y),
    c.impact > n.impactBreakSpeed)) {
        r.fail(`The egg cracked on impact.`);
        return
    }
    e.level.stars.forEach( (t, n) => {
        e.collectedStars.has(n) || Math.hypot(i.x - t.x, i.y - t.y) < 42 && (e.collectedStars.add(n),
        r.collect(t.x, t.y))
    }
    );
    let l = e.level.basket;
    if (Math.abs(i.x - l.x) < 66 && Math.abs(i.y - l.y) < 54 && i.vy > -380) {
        r.success();
        return
    }
    (i.y > E.height + 130 || i.x < -140 || i.x > E.width + 140) && r.fail(`The egg fell out of the map.`)
}
var oe = {
    classic: `none`,
    glass: `hue-rotate(175deg) saturate(0.85) brightness(1.08)`,
    neon: `hue-rotate(95deg) saturate(1.35) brightness(1.12)`,
    gold: `sepia(0.85) saturate(1.8) brightness(1.08)`
};
function K(e, t, n) {
    return Math.max(t, Math.min(n, e))
}
function q(e, t, n, r, i, a) {
    r < 0 && (t += r,
    r = Math.abs(r)),
    i < 0 && (n += i,
    i = Math.abs(i));
    let o = Math.max(0, Math.min(a, r * .5, i * .5));
    e.beginPath(),
    e.moveTo(t + o, n),
    e.arcTo(t + r, n, t + r, n + i, o),
    e.arcTo(t + r, n + i, t, n + i, o),
    e.arcTo(t, n + i, t, n, o),
    e.arcTo(t, n, t + r, n, o),
    e.closePath()
}
function se(e, t, n, r, i, a, o, s=0, c=1, l=`none`) {
    if (!t || !n)
        return;
    let u = n.source
      , d = n.content || u
      , f = a / u.w
      , p = o / u.h;
    e.save(),
    e.translate(r, i),
    e.rotate(s),
    e.globalAlpha = c,
    e.filter = l,
    e.drawImage(t, d.x, d.y, d.w, d.h, -a / 2 + (d.x - u.x) * f, -o / 2 + (d.y - u.y) * p, d.w * f, d.h * p),
    e.restore()
}
function J(e, t, n, r, i, a, o, s=0, c=1, l=`none`) {
    se(e, t?.atlas, t?.frames?.get(n), r, i, a, o, s, c, l)
}
function ce(e) {
    return k[e.type]?.asset || e.type
}
function le(e) {
    let t = e.getContext(`2d`)
      , n = null
      , r = {
        width: 1,
        height: 1,
        dpr: 1,
        play: {
            x: 0,
            y: 0,
            w: 1,
            h: 1
        },
        scale: 1
    };
    function i() {
        let n = e.getBoundingClientRect()
          , i = Math.min(window.devicePixelRatio || 1, 2);
        r.width = Math.max(1, n.width),
        r.height = Math.max(1, n.height),
        r.dpr = i;
        let a = Math.floor(r.width * i)
          , o = Math.floor(r.height * i);
        (e.width !== a || e.height !== o) && (e.width = a,
        e.height = o),
        t.setTransform(i, 0, 0, i, 0, 0);
        let s = r.height < 220
          , c = s ? 0 : K(r.height * .105, 58, 92)
          , l = s ? 0 : K(r.height * .145, 96, 132)
          , u = K(r.width * .026, 8, 22)
          , d = Math.max(1, r.width - u * 2)
          , f = Math.max(1, r.height - c - l)
          , p = Math.min(d / E.width, f / E.height)
          , m = E.width * p
          , h = E.height * p;
        r.scale = p,
        r.play = {
            x: (r.width - m) / 2,
            y: c + (f - h) / 2,
            w: m,
            h
        }
    }
    function a(e, t) {
        return {
            x: r.play.x + e * r.scale,
            y: r.play.y + t * r.scale
        }
    }
    function o(e, t) {
        return {
            x: (e - r.play.x) / r.scale,
            y: (t - r.play.y) / r.scale
        }
    }
    function s(e, t) {
        return e >= r.play.x && e <= r.play.x + r.play.w && t >= r.play.y && t <= r.play.y + r.play.h
    }
    function c() {
        if (n?.backdrop) {
            let e = n.backdrop
              , i = Math.max(r.width / e.width, r.height / e.height)
              , a = e.width * i
              , o = e.height * i;
            t.drawImage(e, (r.width - a) / 2, (r.height - o) / 2, a, o)
        } else {
            let e = t.createLinearGradient(0, 0, 0, r.height);
            e.addColorStop(0, `#c9f3ff`),
            e.addColorStop(1, `#fff0c9`),
            t.fillStyle = e,
            t.fillRect(0, 0, r.width, r.height)
        }
        t.save(),
        t.fillStyle = `rgba(255,255,255,0.58)`,
        t.strokeStyle = `rgba(111, 83, 61, 0.26)`,
        t.lineWidth = 3,
        q(t, r.play.x, r.play.y, r.play.w, r.play.h, 26),
        t.fill(),
        t.stroke(),
        t.restore()
    }
    function l(e, i=!1, o=0) {
        let s = a(e.x, e.y)
          , c = r.scale
          , l = e.fixed && e.type !== `spike` ? .88 : 1;
        if (e.type === `fire`) {
            t.save(),
            t.translate(s.x, s.y);
            let n = (e.w || 118) * c
              , r = (e.h || 86) * c;
            t.globalAlpha = l,
            t.fillStyle = `rgba(81, 42, 26, 0.28)`,
            t.beginPath(),
            t.ellipse(0, r * .38, n * .48, r * .14, 0, 0, Math.PI * 2),
            t.fill();
            for (let i = 0; i < 5; i += 1) {
                let a = (i - 2) * n * .18
                  , s = Math.sin(o * 9 + i * 1.7 + e.x * .01) * r * .08;
                t.fillStyle = i % 2 ? `#ff7a18` : `#ff3d16`,
                t.beginPath(),
                t.moveTo(a - n * .14, r * .34),
                t.quadraticCurveTo(a - n * .2, -r * .02, a + s * .15, -r * (.5 + i * .04) + s),
                t.quadraticCurveTo(a + n * .2, 0, a + n * .14, r * .34),
                t.closePath(),
                t.fill()
            }
            t.fillStyle = `#ffd34e`,
            t.beginPath(),
            t.ellipse(0, r * .18, n * .25, r * .22, 0, 0, Math.PI * 2),
            t.fill(),
            t.restore()
        } else if (e.type === `pan`) {
            t.save(),
            t.translate(s.x, s.y),
            t.rotate(e.angle),
            t.globalAlpha = l;
            let n = (e.w || 176) * c
              , r = (e.h || 72) * c;
            t.fillStyle = `#242c36`,
            q(t, n * .12, -r * .11, n * .48, r * .22, r * .11),
            t.fill(),
            t.fillStyle = `#4b5663`,
            t.beginPath(),
            t.ellipse(-n * .18, 0, n * .36, r * .48, 0, 0, Math.PI * 2),
            t.fill(),
            t.strokeStyle = `#1b222b`,
            t.lineWidth = Math.max(2, 7 * c),
            t.stroke(),
            t.fillStyle = `#687786`,
            t.beginPath(),
            t.ellipse(-n * .18, -r * .04, n * .27, r * .34, 0, 0, Math.PI * 2),
            t.fill(),
            t.strokeStyle = `rgba(255,255,255,0.42)`,
            t.lineWidth = Math.max(1, 3 * c),
            t.beginPath(),
            t.arc(-n * .23, -r * .06, r * .2, Math.PI * 1.08, Math.PI * 1.72),
            t.stroke(),
            t.restore()
        } else
            J(t, n, ce(e), s.x, s.y, (e.w || 120) * c, (e.h || 80) * c, e.angle, l);
        e.type === `fan` && (t.save(),
        t.translate(s.x, s.y),
        t.rotate(e.angle),
        t.globalAlpha = .12,
        t.fillStyle = `#66b9ff`,
        t.beginPath(),
        t.moveTo(20 * c, -88 * c),
        t.lineTo(245 * c, -45 * c),
        t.lineTo(245 * c, 45 * c),
        t.lineTo(20 * c, 88 * c),
        t.closePath(),
        t.fill(),
        t.restore()),
        i && (t.save(),
        t.translate(s.x, s.y),
        t.rotate(e.angle),
        t.strokeStyle = `#4a95ff`,
        t.lineWidth = 3,
        t.setLineDash([8, 6]),
        q(t, -(e.w || 110) * c * .55, -(e.h || 70) * c * .55, (e.w || 110) * c * 1.1, (e.h || 70) * c * 1.1, 14),
        t.stroke(),
        t.restore())
    }
    function u(e) {
        e.drawnStrokes.length && (t.save(),
        t.lineCap = `round`,
        t.lineJoin = `round`,
        e.drawnStrokes.forEach(n => {
            if (n.points.length < 2)
                return;
            let i = a(n.points[0].x, n.points[0].y);
            t.beginPath(),
            t.moveTo(i.x, i.y);
            for (let e = 1; e < n.points.length; e += 1) {
                let r = a(n.points[e].x, n.points[e].y);
                t.lineTo(r.x, r.y)
            }
            t.strokeStyle = `rgba(87, 58, 44, 0.92)`,
            t.lineWidth = Math.max(5, 16 * r.scale),
            t.stroke(),
            t.strokeStyle = e.mode === `ready` ? `#ffbf5b` : `#e9a744`,
            t.lineWidth = Math.max(3, 9 * r.scale),
            t.stroke()
        }
        ),
        t.restore())
    }
    function d(e) {
        i(),
        t.clearRect(0, 0, r.width, r.height),
        c(),
        t.save(),
        q(t, r.play.x, r.play.y, r.play.w, r.play.h, 26),
        t.clip(),
        u(e),
        e.level.stars.forEach( (i, o) => {
            if (e.collectedStars.has(o))
                return;
            let s = a(i.x, i.y)
              , c = 1 + Math.sin(e.clock * 4 + o) * .07;
            J(t, n, `star`, s.x, s.y, 54 * r.scale * c, 54 * r.scale * c, 0, 1)
        }
        );
        let o = a(e.level.basket.x, e.level.basket.y);
        J(t, n, `basket`, o.x, o.y, 130 * r.scale, 96 * r.scale, 0, 1),
        e.level.fixedObjects.forEach(t => l(t, !1, e.clock)),
        e.placedObjects.forEach(t => l(t, e.selectedObjectId === t.id, e.clock)),
        e.particles.forEach(e => {
            let n = a(e.x, e.y);
            t.save(),
            t.globalAlpha = e.life,
            t.fillStyle = e.color,
            t.beginPath(),
            t.arc(n.x, n.y, e.size * r.scale, 0, Math.PI * 2),
            t.fill(),
            t.restore()
        }
        );
        let s = a(e.egg.x, e.egg.y)
          , d = e.mode === `success` ? 1.08 : 1
          , f = e.mode === `failed` ? `cracked_egg` : `egg`
          , p = oe[e.skin] || `none`;
        J(t, n, f, s.x, s.y, 76 * r.scale * d, 76 * r.scale / d, e.egg.rotation, 1, p),
        t.restore(),
        e.mode === `failed` && (t.save(),
        t.fillStyle = `rgba(255, 125, 125, 0.16)`,
        t.fillRect(0, 0, r.width, r.height),
        t.restore())
    }
    return {
        setAssets(e) {
            n = e
        },
        resize: i,
        render: d,
        layout: r,
        screenToWorld: o,
        worldToScreen: a,
        isInsidePlay: s
    }
}
var Y = 1;
function X() {
    return {
        version: Y,
        unlockedLevel: 1,
        bestStars: Array.from({
            length: 50
        }, () => 0),
        skin: `classic`
    }
}
async function ue(e) {
    try {
        let t = await e.gameState.load();
        if (!t || t.version !== Y)
            return X();
        let n = Array.from({
            length: 50
        }, (e, n) => {
            let r = Number(t.bestStars?.[n]);
            return Number.isFinite(r) ? Math.max(0, Math.min(3, Math.floor(r))) : 0
        }
        );
        return {
            version: Y,
            unlockedLevel: Math.max(1, Math.min(50, Math.floor(t.unlockedLevel || 1))),
            bestStars: n,
            skin: [`classic`, `glass`, `neon`, `gold`].includes(t.skin) ? t.skin : `classic`
        }
    } catch {
        return X()
    }
}
async function de(e, t) {
    try {
        await e.gameState.save({
            version: Y,
            unlockedLevel: t.unlockedLevel,
            bestStars: t.bestStars,
            skin: t.skin
        })
    } catch {}
}
async function fe(e, t) {
    try {
        await e.leaderboard.submit(t)
    } catch {}
}
function pe(e) {
    return e.bestStars.reduce( (e, t) => e + t, 0)
}
function Z(e) {
    return `★`.repeat(e) + `☆`.repeat(3 - e)
}
function me({root: e, actions: t}) {
    e.className = `egg-game`,
    e.innerHTML = `
    <canvas class="egg-canvas" hidden></canvas>
    <div class="egg-hud">
      <div class="egg-hud-main"><span data-field="level">Level 1</span><span data-field="stars">☆☆☆</span></div>
      <div class="egg-hud-sub"><span data-field="timer">0:00</span><span data-field="ink">Ink 100%</span><span data-field="best">Best ☆☆☆</span></div>
    </div>
    <div class="egg-top-actions">
      <button type="button" class="egg-icon egg-icon-wide" data-action="reset" aria-label="Reset level">↻</button>
      <button type="button" class="egg-play" data-action="play" aria-label="Run the egg">Play</button>
    </div>
    <div class="egg-toast" data-field="toast" hidden></div>
    <div class="egg-tray" data-field="tray"></div>
    <div class="egg-editbar">
      <button type="button" class="egg-small" data-action="undo">Undo</button>
      <button type="button" class="egg-small" data-action="clear">Clear</button>
      <button type="button" class="egg-small" data-action="rotateLeft">⟲</button>
      <button type="button" class="egg-small" data-action="rotateRight">⟳</button>
      <button type="button" class="egg-small" data-action="delete">Delete</button>
    </div>
    <div class="egg-overlay" data-overlay="start">
      <div class="egg-panel">
        <h1>Bouncy Egg</h1>
        <p data-field="startCopy">Loading puzzle pieces…</p>
        <button type="button" class="egg-primary" data-action="start">Loading…</button>
      </div>
    </div>
    <div class="egg-overlay" data-overlay="result" hidden>
      <div class="egg-panel">
        <h2 data-field="resultTitle">Nice catch!</h2>
        <div class="egg-result-stars" data-field="resultStars">★★★</div>
        <p data-field="resultCopy">The egg landed safely.</p>
        <div class="egg-actions-row">
          <button type="button" class="egg-primary" data-action="resultNext">Next</button>
          <button type="button" class="egg-secondary" data-action="resultRetry">Retry</button>
        </div>
      </div>
    </div>
  `,
    e.classList.add(`egg-intro-open`);
    let n = e.querySelector(`.egg-canvas`)
      , r = e.querySelector(`[data-field="tray"]`)
      , i = {
        level: e.querySelector(`[data-field="level"]`),
        stars: e.querySelector(`[data-field="stars"]`),
        timer: e.querySelector(`[data-field="timer"]`),
        ink: e.querySelector(`[data-field="ink"]`),
        best: e.querySelector(`[data-field="best"]`),
        toast: e.querySelector(`[data-field="toast"]`),
        startCopy: e.querySelector(`[data-field="startCopy"]`),
        resultTitle: e.querySelector(`[data-field="resultTitle"]`),
        resultStars: e.querySelector(`[data-field="resultStars"]`),
        resultCopy: e.querySelector(`[data-field="resultCopy"]`)
    }
      , a = e.querySelector(`[data-overlay="start"]`)
      , o = e.querySelector(`[data-overlay="result"]`)
      , s = e.querySelector(`[data-action="start"]`)
      , c = [...e.querySelectorAll(`button[data-action]`)]
      , l = ``;
    function u(t, n) {
        e.querySelector(`[data-action="${t}"]`)?.addEventListener(`click`, n)
    }
    u(`start`, t.start),
    u(`play`, t.play),
    u(`reset`, t.reset),
    u(`undo`, t.undoStroke),
    u(`clear`, t.clearStrokes),
    u(`rotateLeft`, () => t.rotate(-1)),
    u(`rotateRight`, () => t.rotate(1)),
    u(`delete`, t.deleteSelected),
    u(`resultNext`, t.next),
    u(`resultRetry`, t.reset);
    function d(e) {
        let n = Math.max(0, e.level.inkLimit - e.inkUsed)
          , i = [e.level.number, e.mode, e.selectedTool, JSON.stringify(e.remainingTools)].join(`|`);
        if (i !== l) {
            l = i,
            r.replaceChildren();
            let n = document.createElement(`button`);
            n.type = `button`,
            n.dataset.tool = `draw`,
            n.className = `egg-tool${e.selectedTool === `draw` ? ` is-selected` : ``}`,
            n.innerHTML = `<span>✎ Draw</span><strong></strong>`,
            n.addEventListener(`click`, () => t.selectTool(`draw`)),
            r.append(n),
            Object.entries(e.level.tools).forEach( ([n,i]) => {
                let a = k[n]
                  , o = document.createElement(`button`);
                o.type = `button`,
                o.className = `egg-tool${e.selectedTool === n ? ` is-selected` : ``}`,
                o.disabled = e.mode !== `ready` || e.remainingTools[n] <= 0,
                o.innerHTML = `<span>${a.label}</span><strong>${e.remainingTools[n]}/${i}</strong>`,
                o.addEventListener(`click`, () => t.selectTool(n)),
                r.append(o)
            }
            )
        }
        let a = r.querySelector(`[data-tool="draw"]`);
        a.disabled = e.mode !== `ready` || n < 1,
        a.querySelector(`strong`).textContent = `${Math.ceil(n)} ink`
    }
    return {
        canvas: n,
        setLoading(t, r=!1, o=!1) {
            n.hidden = t && !r,
            i.startCopy.textContent = r ? `Could not load the puzzle. Tap Retry.` : t ? o ? `Starting… hang on a second.` : `Loading puzzle pieces…` : `1. Draw a path to the basket
2. Tap Play when you are ready`,
            s.textContent = r ? `Retry` : t ? o ? `Starting…` : `Loading…` : `Tap to Start`,
            s.disabled = t && !r,
            r && (a.hidden = !1,
            e.classList.add(`egg-intro-open`))
        },
        hideStart() {
            a.hidden = !0,
            e.classList.remove(`egg-intro-open`)
        },
        update(t, n) {
            i.level.textContent = `Level ${t.level.number}`,
            i.stars.textContent = Z(t.collectedStars.size),
            i.timer.textContent = `${Math.max(0, Math.ceil(t.timeLimit - t.elapsed))}s`,
            i.ink.textContent = `Ink ${Math.max(0, Math.round((1 - t.inkUsed / t.level.inkLimit) * 100))}%`,
            i.best.textContent = `Best ${Z(n.bestStars[t.level.number - 1] || 0)}`,
            i.toast.hidden = !t.toast,
            i.toast.textContent = t.toast,
            e.querySelector(`[data-action="play"]`).disabled = t.mode !== `ready` || a.hidden === !1,
            e.querySelector(`[data-action="reset"]`).disabled = t.mode === `running`,
            e.querySelector(`[data-action="undo"]`).disabled = t.mode !== `ready` || t.drawnStrokes.length === 0,
            e.querySelector(`[data-action="clear"]`).disabled = t.mode !== `ready` || t.drawnStrokes.length === 0,
            e.querySelector(`[data-action="rotateLeft"]`).disabled = t.mode !== `ready` || !t.selectedObjectId,
            e.querySelector(`[data-action="rotateRight"]`).disabled = t.mode !== `ready` || !t.selectedObjectId,
            e.querySelector(`[data-action="delete"]`).disabled = t.mode !== `ready` || !t.selectedObjectId,
            d(t)
        },
        showResult(e) {
            i.resultTitle.textContent = e.success ? `Nice catch!` : `Cracked!`,
            i.resultStars.textContent = e.success ? Z(e.stars) : `☆☆☆`,
            i.resultCopy.textContent = e.message,
            o.hidden = !1
        },
        hideResult() {
            o.hidden = !0
        },
        destroy() {
            c.forEach(e => e.replaceWith(e.cloneNode(!0)))
        }
    }
}
var he = [`gravity`, `impactBreakSpeed`, `bounceStrength`, `fanStrength`, `timeLimit`, `effectsIntensity`]
  , ge = {
    gravity: 880,
    impactBreakSpeed: 720,
    bounceStrength: 1,
    fanStrength: 520,
    timeLimit: 60,
    effectsIntensity: 1
};
function Q(e, t, n) {
    return Math.max(t, Math.min(n, e))
}
function _e(e) {
    let t = {
        ...ge
    };
    return he.forEach(n => {
        let r = Number(e.get(n));
        Number.isFinite(r) && (t[n] = r)
    }
    ),
    t
}
function ve(e) {
    return Object.fromEntries(Object.entries(e).map( ([e,t]) => [e, t]))
}
function $(e, t, n, r, i) {
    for (let a = 0; a < i * e.config.effectsIntensity; a += 1) {
        let i = Math.random() * Math.PI * 2
          , a = 90 + Math.random() * 220;
        e.particles.push({
            x: t,
            y: n,
            vx: Math.cos(i) * a,
            vy: Math.sin(i) * a - 80,
            life: 1,
            size: 5 + Math.random() * 8,
            color: r
        })
    }
}
function ye({mount: e, sdk: t, tweaks: n, assets: r}) {
    let i = document.createElement(`section`)
      , a = _e(n)
      , o = null
      , s = null
      , c = te(t)
      , l = null
      , u = 0
      , d = 0
      , f = null
      , p = null
      , m = {
        x: 0,
        y: 0
    }
      , h = !1
      , g = !1
      , _ = !1
      , v = !1
      , y = he.map(e => n.subscribe(e, t => {
        let n = Number(t);
        Number.isFinite(n) && (a[e] = n)
    }
    ))
      , b = {
        mode: `loading`,
        clock: 0,
        elapsed: 0,
        timeLimit: a.timeLimit,
        level: L(1),
        egg: G(L(1)),
        placedObjects: [],
        collectedStars: new Set,
        remainingTools: {},
        selectedTool: `draw`,
        selectedObjectId: null,
        drawnStrokes: [],
        inkUsed: 0,
        particles: [],
        toast: ``,
        toastUntil: 0,
        skin: `classic`,
        config: a
    };
    function x(e, t=1.4) {
        b.toast = e,
        b.toastUntil = b.clock + t
    }
    function S(e) {
        b.level = L(Q(e, 1, l?.unlockedLevel || 1)),
        b.egg = G(b.level),
        b.mode = `ready`,
        b.elapsed = 0,
        b.timeLimit = Math.min(a.timeLimit, b.level.timeLimit),
        b.placedObjects = [],
        b.collectedStars = new Set,
        b.remainingTools = ve(b.level.tools),
        b.selectedTool = `draw`,
        b.selectedObjectId = null,
        b.drawnStrokes = [],
        b.inkUsed = 0,
        b.particles = [],
        b.toast = ``,
        f = null,
        p = null,
        s?.hideResult()
    }
    async function C() {
        await de(t, l),
        fe(t, pe(l))
    }
    function w(e, t) {
        if ([`running`, `ready`].includes(b.mode))
            if (b.mode = e ? `success` : `failed`,
            e) {
                let e = b.inkUsed <= b.level.parInk && b.placedObjects.length <= b.level.parTools && b.elapsed <= b.timeLimit * .78
                  , t = 1 + +(b.collectedStars.size >= 2) + +!!e
                  , n = b.level.number - 1;
                l.bestStars[n] = Math.max(l.bestStars[n] || 0, t),
                l.unlockedLevel = Math.max(l.unlockedLevel, Math.min(50, b.level.number + 1)),
                c.success(),
                $(b, b.level.basket.x, b.level.basket.y - 50, `#ffd166`, 24),
                s.showResult({
                    success: !0,
                    stars: t,
                    message: `${b.collectedStars.size}/3 bonus stars • ${Math.ceil(b.inkUsed)} ink • ${b.placedObjects.length} tools`
                }),
                C()
            } else
                b.egg.broken = !0,
                c.crack(),
                $(b, b.egg.x, b.egg.y, `#ffffff`, 12),
                s.showResult({
                    success: !1,
                    stars: 0,
                    message: t
                })
    }
    function T() {
        if (b.mode !== `loading`) {
            if (!_) {
                x(`Tap Start on the welcome screen first.`);
                return
            }
            c.unlock(),
            (b.mode === `success` || b.mode === `failed`) && S(b.level.number),
            b.mode === `ready` ? (p && p.points.length < 2 && b.drawnStrokes.pop(),
            p = null,
            f = null,
            b.mode = `running`,
            b.selectedObjectId = null,
            x(`Path locked — egg rolling!`)) : b.mode === `running` && x(`Reset or retry to change the path.`)
        }
    }
    function D() {
        c.unlock(),
        s.hideStart(),
        _ = !0,
        v = !1
    }
    function O() {
        if (!g) {
            v = !0,
            s.setLoading(!0, !1, !0),
            W();
            return
        }
        D()
    }
    function k() {
        if (b.mode === `running`)
            return;
        let e = Math.min(l.unlockedLevel, b.level.number + 1, 50);
        if (e === b.level.number) {
            x(`Finish this level to unlock the next one.`);
            return
        }
        S(e)
    }
    function A() {
        S(b.level.number)
    }
    function j(e) {
        if (b.mode !== `ready`)
            return;
        let t = b.placedObjects.find(e => e.id === b.selectedObjectId);
        t && (t.angle += Math.PI / 18 * e)
    }
    function M() {
        if (b.mode !== `ready`)
            return;
        let e = b.placedObjects.findIndex(e => e.id === b.selectedObjectId);
        if (e < 0)
            return;
        let[t] = b.placedObjects.splice(e, 1);
        b.remainingTools[t.type] += 1,
        b.selectedObjectId = null
    }
    function ne() {
        if (b.mode !== `ready`)
            return;
        let e = b.drawnStrokes.pop();
        e && (b.inkUsed = Math.max(0, b.inkUsed - e.length),
        p = null)
    }
    function N() {
        b.mode === `ready` && (b.drawnStrokes = [],
        b.inkUsed = 0,
        p = null)
    }
    function P(e) {
        for (let t = b.placedObjects.length - 1; t >= 0; --t) {
            let n = b.placedObjects[t]
              , r = e.x - n.x
              , i = e.y - n.y;
            if (Math.hypot(r, i) < Math.max(n.w || 100, n.h || 80) * .62)
                return n
        }
        return null
    }
    function F(e) {
        let t = s.canvas.getBoundingClientRect();
        return o.screenToWorld(e.clientX - t.left, e.clientY - t.top)
    }
    function I(e) {
        if (b.mode !== `ready`)
            return;
        let t = s.canvas.getBoundingClientRect()
          , n = e.clientX - t.left
          , r = e.clientY - t.top;
        if (!o.isInsidePlay(n, r))
            return;
        let i = F(e)
          , a = P(i);
        if (a) {
            b.selectedObjectId = a.id,
            f = a.id,
            m = {
                x: a.x - i.x,
                y: a.y - i.y
            },
            s.canvas.setPointerCapture?.(e.pointerId);
            return
        }
        if (b.selectedTool === `draw`) {
            if (b.inkUsed >= b.level.inkLimit) {
                x(`Out of ink — undo or clear a line.`);
                return
            }
            p = {
                id: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                points: [{
                    x: Q(i.x, 6, E.width - 6),
                    y: Q(i.y, 6, E.height - 6)
                }],
                length: 0
            },
            b.drawnStrokes.push(p),
            b.selectedObjectId = null,
            s.canvas.setPointerCapture?.(e.pointerId);
            return
        }
        if ((b.remainingTools[b.selectedTool] || 0) <= 0)
            return;
        let c = re(b.selectedTool, Q(i.x, 45, E.width - 45), Q(i.y, 45, E.height - 45));
        b.placedObjects.push(c),
        --b.remainingTools[b.selectedTool],
        b.selectedObjectId = c.id,
        f = c.id,
        m = {
            x: 0,
            y: 0
        },
        s.canvas.setPointerCapture?.(e.pointerId)
    }
    function R(e) {
        if (b.mode !== `ready`)
            return;
        if (p) {
            let t = F(e)
              , n = p.points[p.points.length - 1]
              , r = {
                x: Q(t.x, 6, E.width - 6),
                y: Q(t.y, 6, E.height - 6)
            }
              , i = Math.hypot(r.x - n.x, r.y - n.y);
            if (i < 9)
                return;
            let a = b.level.inkLimit - b.inkUsed;
            if (a <= 0) {
                p = null;
                return
            }
            let o = Math.min(i, a)
              , s = o / i;
            p.points.push({
                x: n.x + (r.x - n.x) * s,
                y: n.y + (r.y - n.y) * s
            }),
            p.length += o,
            b.inkUsed += o,
            o < i && (p = null,
            x(`Ink used up!`));
            return
        }
        if (!f)
            return;
        let t = b.placedObjects.find(e => e.id === f);
        if (!t)
            return;
        let n = F(e);
        t.x = Q(n.x + m.x, 35, E.width - 35),
        t.y = Q(n.y + m.y, 35, E.height - 35)
    }
    function z(e) {
        p && p.points.length < 2 && b.drawnStrokes.pop(),
        p = null,
        f = null,
        s.canvas.releasePointerCapture?.(e.pointerId)
    }
    function B(e) {
        e.code === `Space` && (T(),
        e.preventDefault()),
        e.code === `KeyR` && (A(),
        e.preventDefault()),
        e.code === `KeyQ` && j(-1),
        e.code === `KeyE` && j(1),
        (e.code === `Delete` || e.code === `Backspace`) && M()
    }
    function V(e) {
        for (let t = b.particles.length - 1; t >= 0; --t) {
            let n = b.particles[t];
            n.vy += 280 * e,
            n.x += n.vx * e,
            n.y += n.vy * e,
            n.life -= e * 1.45,
            n.life <= 0 && b.particles.splice(t, 1)
        }
    }
    function H(e) {
        if (b.clock += e,
        b.toast && b.clock > b.toastUntil && (b.toast = ``),
        V(e),
        b.mode === `running`) {
            if (b.elapsed += e,
            b.elapsed > b.timeLimit) {
                w(!1, `Time ran out before the egg reached the basket.`);
                return
            }
            ae(b, e, a, {
                bounce(e, t, n, r) {
                    c.bounce(e),
                    [`spring`, `pad`].includes(t) && $(b, n, r, `#9be7ff`, 5)
                },
                collect(e, t) {
                    c.collect(),
                    $(b, e, t, `#ffd166`, 10)
                },
                success() {
                    w(!0, `The egg landed safely.`)
                },
                fail(e) {
                    w(!1, e)
                }
            })
        }
    }
    function U(e) {
        let t = Math.min(.033, Math.max(0, (e - d) / 1e3 || 0));
        d = e,
        H(t),
        s?.update(b, l || {
            bestStars: []
        }),
        o && !s.canvas.hidden && o.render(b),
        u = requestAnimationFrame(U)
    }
    async function W() {
        if (!h) {
            h = !0,
            s.setLoading(!0, !1, v);
            try {
                let[e,n] = await Promise.all([ee(r), ue(t), c.prepare()]);
                l = n,
                b.skin = `classic`,
                o.setAssets(e),
                g = !0,
                s.setLoading(!1),
                S(l.unlockedLevel),
                v && D()
            } catch {
                v = !1,
                s.setLoading(!1, !0)
            } finally {
                h = !1
            }
        }
    }
    return {
        start() {
            e.replaceChildren(i),
            s = me({
                root: i,
                actions: {
                    start: O,
                    play: T,
                    reset: A,
                    next: k,
                    rotate: j,
                    deleteSelected: M,
                    undoStroke: ne,
                    clearStrokes: N,
                    selectTool(e) {
                        b.mode === `ready` && (b.selectedTool = e,
                        b.selectedObjectId = null)
                    }
                }
            }),
            o = le(s.canvas),
            s.canvas.addEventListener(`pointerdown`, I),
            s.canvas.addEventListener(`pointermove`, R),
            s.canvas.addEventListener(`pointerup`, z),
            s.canvas.addEventListener(`pointercancel`, z),
            window.addEventListener(`keydown`, B),
            W(),
            d = performance.now(),
            u = requestAnimationFrame(U)
        },
        destroy() {
            cancelAnimationFrame(u),
            s?.canvas.removeEventListener(`pointerdown`, I),
            s?.canvas.removeEventListener(`pointermove`, R),
            s?.canvas.removeEventListener(`pointerup`, z),
            s?.canvas.removeEventListener(`pointercancel`, z),
            window.removeEventListener(`keydown`, B),
            y.forEach(e => e?.()),
            c.dispose(),
            s?.destroy(),
            e.replaceChildren()
        }
    }
}
var be = {
    gravity: {
        type: `number`,
        value: 880,
        min: 620,
        max: 1160,
        step: 10,
        name: `Gravity`,
        description: `Downward acceleration for the egg physics.`,
        group: `physics`,
        index: 1
    },
    impactBreakSpeed: {
        type: `number`,
        value: 720,
        min: 480,
        max: 980,
        step: 10,
        name: `Impact Break Speed`,
        description: `Hard-surface impact speed that cracks the egg.`,
        group: `physics`,
        index: 2
    },
    bounceStrength: {
        type: `number`,
        value: 1,
        min: .65,
        max: 1.35,
        step: .05,
        name: `Bounce Strength`,
        description: `Global multiplier for springs and bouncy pads.`,
        group: `physics`,
        index: 3
    },
    fanStrength: {
        type: `number`,
        value: 520,
        min: 260,
        max: 820,
        step: 10,
        name: `Fan Strength`,
        description: `Push acceleration from fan tools.`,
        group: `tools`,
        index: 4
    },
    timeLimit: {
        type: `number`,
        value: 60,
        min: 35,
        max: 90,
        step: 1,
        name: `Level Time Limit`,
        description: `Seconds before the optional clock fails the level.`,
        group: `rules`,
        index: 5
    },
    effectsIntensity: {
        type: `number`,
        value: 1,
        min: .5,
        max: 1.5,
        step: .05,
        name: `Effects Intensity`,
        description: `Confetti, squash, and bounce feedback intensity.`,
        group: `visual`,
        index: 6
    }
}
  , xe = {
    BOUNCY_OBJECT_ATLAS: `/generated-assets/bouncy_object_atlas-transparent.webp`,
    BOUNCY_BACKDROP: `/generated-assets/bouncy_backdrop.webp`
};
ye({
    mount: document.querySelector(`#app`),
    sdk: x,
    ready: await x.ready(),
    tweaks: await x.tweaks.init(be),
    assets: Object.keys(xe).length > 0 ? await x.assets.register(xe) : void 0
}).start();
