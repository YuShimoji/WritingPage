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