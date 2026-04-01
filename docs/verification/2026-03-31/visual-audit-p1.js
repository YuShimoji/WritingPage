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
    return { exists:true, sel:s, display:c.display, visibility:c.visibility,
             hidden:e.hidden, ariaHidden:e.getAttribute("aria-hidden"),
             classList:Array.from(e.classList), w:e.offsetWidth, h:e.offsetHeight };
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
  await shot(page, "s1-normal-initial");
  var s1sb = await getEl(page, "#sidebar");
  var s1tb = await getEl(page, "#toolbar");
  var s1tg = await getEl(page, "#toggle-sidebar");
  console.log("S1 sidebar:" + JSON.stringify(s1sb));
  console.log("S1 toolbar:" + JSON.stringify(s1tb));
  console.log("S1 toggle:" + JSON.stringify(s1tg));
  R.push({ scenario: 1, sidebar: s1sb, toolbar: s1tb, toggleBtn: s1tg });
  console.log("S2: Sidebar open");
  await page.click("#toggle-sidebar");
  await d(500);
  await shot(page, "s2-sidebar-open");
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
  await shot(page, "s2-sidebar-closed");
  var s2c = await getEl(page, "#sidebar");
  console.log("S2 closed:" + JSON.stringify(s2c));
  R.push({ scenario: "2b", sidebarClosed: s2c });