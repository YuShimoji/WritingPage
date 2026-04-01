var pw = require("playwright");
var chromium = pw.chromium;
var path = require("path");
var fs = require("fs");
var OUT = "c:/Users/thank/Storage/Media Contents Projects/WritingPage/docs/verification/2026-03-31";
var VW = { width: 1280, height: 800 };
function d(ms) { return new Promise(function(r){ setTimeout(r,ms); }); }
async function shot(page, name) {
  var dest = OUT + "/" + name + ".png";
  await page.screenshot({ path: dest, fullPage: false });
  console.log("[shot] " + name);
}
async function getEl(page, sel) {
  return page.evaluate(function(s) {
    var e = document.querySelector(s);
    if (!e) return { exists: false, sel: s };
    var c = window.getComputedStyle(e);
    var r = e.getBoundingClientRect();
    return { exists:true, sel:s, display:c.display, visibility:c.visibility,
             hidden:e.hidden, ariaHidden:e.getAttribute("aria-hidden"),
             classList:Array.from(e.classList), w:e.offsetWidth, h:e.offsetHeight,
             rectTop:r.top, rectLeft:r.left };
  }, sel);
}
async function getCats(page) {
  return page.evaluate(function() {
    return Array.from(document.querySelectorAll(".accordion-category")).map(function(c) {
      return { cat:c.getAttribute("data-category"), display:window.getComputedStyle(c).display,
               ariaHidden:c.getAttribute("aria-hidden") };
    });
  });
}
async function main() {
  var browser = await chromium.launch({ headless: true });
  var ctx = await browser.newContext({ viewport: VW });
  var page = await ctx.newPage();
  var R = [];
  console.log("S1: Normal initial");
  await page.goto("http://localhost:8080/?reset=1", { waitUntil: "networkidle" });
  await d(500);
  var initMode = await page.evaluate(function() { return document.documentElement.getAttribute("data-ui-mode"); });
  console.log("S1 initial mode: " + initMode);
  await shot(page, "s1-raw");
  await page.evaluate(function() { ZenWriterApp.setUIMode("normal"); });
  await d(500);
  await shot(page, "s1-normal");
  var s1sb = await getEl(page, "#sidebar");
  var s1tb = await getEl(page, "#toolbar");
  var s1tg = await getEl(page, "#toggle-sidebar");
  console.log("S1 sidebar:" + JSON.stringify(s1sb));
  console.log("S1 toolbar:" + JSON.stringify(s1tb));
  console.log("S1 toggle:" + JSON.stringify(s1tg));
  R.push({ scenario: 1, initialMode: initMode, sidebar: s1sb, toolbar: s1tb, toggleBtn: s1tg, note: initMode !== "normal" ? "BUG: started in " + initMode : "OK" });
  console.log("S2: Sidebar open");
  await page.click("#toggle-sidebar");
  await d(500);
  await shot(page, "s2-open");
  var s2o = await getEl(page, "#sidebar");
  var s2cats = await page.evaluate(function() {
    return Array.from(document.querySelectorAll(".accordion-category")).map(function(c) {
      return { cat:c.getAttribute("data-category"), display:window.getComputedStyle(c).display };
    });
  });
  console.log("S2 open:" + JSON.stringify(s2o));
  console.log("S2 cats:" + JSON.stringify(s2cats));
  R.push({ scenario: "2a", sidebarOpen: s2o, categories: s2cats });
  await page.click("#toggle-sidebar");
  await d(500);
  await shot(page, "s2-closed");
  var s2c = await getEl(page, "#sidebar");
  console.log("S2 closed:" + JSON.stringify(s2c));
  R.push({ scenario: "2b", sidebarClosed: s2c });
  console.log("S3: Focus mode");
  await page.evaluate(function() { ZenWriterApp.setUIMode("focus"); });
  await d(500);
  await shot(page, "s3-focus");
  var s3sb = await getEl(page, "#sidebar");
  var s3tb = await getEl(page, "#toolbar");
  console.log("S3 sidebar:" + JSON.stringify(s3sb));
  console.log("S3 toolbar:" + JSON.stringify(s3tb));
  await page.mouse.move(5, 400);
  await d(500);
  await shot(page, "s3-left-edge");
  var s3p = await page.evaluate(function() {
    return ["#focus-rail", ".focus-rail", "#focus-chapter-panel", ".focus-chapter-panel"].map(function(s) {
      var e = document.querySelector(s);
      if (!e) return { sel: s, exists: false };
      return { sel: s, exists: true, display: window.getComputedStyle(e).display, w: e.offsetWidth };
    });
  });
  console.log("S3 panels:" + JSON.stringify(s3p));
  R.push({ scenario: 3, sidebar: s3sb, toolbar: s3tb, panels: s3p });
  console.log("S4: Focus + sidebar");
  await page.evaluate(function() { document.getElementById("toggle-sidebar").click(); });
  await d(500);
  await shot(page, "s4-focus-sidebar");
  var s4sb = await getEl(page, "#sidebar");
  var s4nf = await page.evaluate(function() {
    var cats = ["edit", "theme", "assist", "advanced"];
    return cats.map(function(cat) {
      var sel = "[data-category=" + JSON.stringify(cat) + "]";
      var e = document.querySelector(sel);
      if (!e) return { cat: cat, exists: false };
      return { cat: cat, exists: true, display: window.getComputedStyle(e).display, ariaHidden: e.getAttribute("aria-hidden") };
    });
  });
  var s4all = await getCats(page);
  console.log("S4 sidebar:" + JSON.stringify(s4sb));
  console.log("S4 non-focus:" + JSON.stringify(s4nf));
  console.log("S4 all:" + JSON.stringify(s4all));
  R.push({ scenario: 4, sidebarState: s4sb, nonFocusCats: s4nf, allCats: s4all });
  console.log("S5: Back to Normal");
  await page.evaluate(function() { ZenWriterApp.setUIMode("normal"); });
  await d(500);
  await shot(page, "s5-normal");
  var s5tb = await getEl(page, "#toolbar");
  var s5sb = await getEl(page, "#sidebar");
  var s5c = await getCats(page);
  console.log("S5 toolbar:" + JSON.stringify(s5tb));
  console.log("S5 sidebar:" + JSON.stringify(s5sb));
  console.log("S5 cats:" + JSON.stringify(s5c));
  R.push({ scenario: 5, toolbar: s5tb, sidebar: s5sb, categories: s5c });
  console.log("S6: Reader mode");
  await page.evaluate(function() { ZenWriterApp.setUIMode("reader"); });
  await d(500);
  await shot(page, "s6-reader");
  var s6sb = await getEl(page, "#sidebar");
  var s6tb = await getEl(page, "#toolbar");
  var s6re = await page.evaluate(function() {
    return [".reader-preview", "#reader-preview", "#reader-pane", ".reader-pane"].map(function(s) {
      var e = document.querySelector(s);
      if (!e) return { sel: s, exists: false };
      return { sel: s, exists: true, display: window.getComputedStyle(e).display, w: e.offsetWidth, h: e.offsetHeight };
    });
  });
  console.log("S6 sidebar:" + JSON.stringify(s6sb));
  console.log("S6 toolbar:" + JSON.stringify(s6tb));
  console.log("S6 reader:" + JSON.stringify(s6re));
  R.push({ scenario: 6, sidebar: s6sb, toolbar: s6tb, readerElements: s6re });
  console.log("S7: Reader to Normal");
  await page.evaluate(function() { ZenWriterApp.setUIMode("normal"); });
  await d(500);
  await shot(page, "s7-reader-normal");
  var s7tb = await getEl(page, "#toolbar");
  var s7sb = await getEl(page, "#sidebar");
  var s7c = await getCats(page);
  console.log("S7 toolbar:" + JSON.stringify(s7tb));
  console.log("S7 sidebar:" + JSON.stringify(s7sb));
  console.log("S7 cats:" + JSON.stringify(s7c));
  R.push({ scenario: 7, toolbar: s7tb, sidebar: s7sb, categories: s7c });
  console.log("S8: Round trip");
  await page.evaluate(function() { ZenWriterApp.setUIMode("focus"); });
  await d(500);
  await page.evaluate(function() { ZenWriterApp.setUIMode("reader"); });
  await d(500);
  await page.evaluate(function() { ZenWriterApp.setUIMode("normal"); });
  await d(500);
  await shot(page, "s8-roundtrip");
  var s8tb = await getEl(page, "#toolbar");
  var s8sb = await getEl(page, "#sidebar");
  var s8c = await getCats(page);
  console.log("S8 toolbar:" + JSON.stringify(s8tb));
  console.log("S8 sidebar:" + JSON.stringify(s8sb));
  console.log("S8 cats:" + JSON.stringify(s8c));
  R.push({ scenario: 8, toolbar: s8tb, sidebar: s8sb, categories: s8c });
  fs.writeFileSync(OUT + "/audit-results.json", JSON.stringify(R, null, 2), "utf8");
  console.log("Results saved.");
  await browser.close();
}
main().catch(function(err) { console.error("FATAL:", err); process.exit(1); });