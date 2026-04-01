  console.log("S3: Focus mode");
  await page.evaluate(function() { ZenWriterApp.setUIMode("focus"); });
  await d(500);
  await shot(page, "s3-focus-mode");
  var s3sb = await getEl(page, "#sidebar");
  var s3tb = await getEl(page, "#toolbar");
  console.log("S3 sidebar:" + JSON.stringify(s3sb));
  console.log("S3 toolbar:" + JSON.stringify(s3tb));
  await page.mouse.move(5, 400);
  await d(500);
  await shot(page, "s3-focus-left-edge");
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
  await page.click("#toggle-sidebar");
  await d(500);
  await shot(page, "s4-focus-sidebar-open");
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