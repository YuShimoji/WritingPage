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