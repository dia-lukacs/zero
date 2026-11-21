// Shows the page grid on top of the page while you press G (press again to hide).
// Adding ?grid to the address shows it from the start. Meant for building and
// checking the layout; it changes nothing else on the page.
(function () {
  var root = document.documentElement;
  var overlay = document.createElement("div");
  overlay.className = "grid-overlay";
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.position = document.body.style.position || "relative";
  document.body.appendChild(overlay);

  // Fill the overlay with square cells: as many rows as the page is tall.
  function draw() {
    var columns = parseInt(getComputedStyle(root).getPropertyValue("--grid-columns"), 10) || 4;
    var style = getComputedStyle(overlay);
    var gap = parseFloat(style.columnGap) || 0;
    var inner = overlay.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    var cell = (inner - gap * (columns - 1)) / columns;
    if (!(cell > 0)) return;

    overlay.style.gridAutoRows = cell + "px";
    var rows = Math.ceil((document.documentElement.scrollHeight + gap) / (cell + gap));
    var wanted = rows * columns;
    while (overlay.children.length < wanted) overlay.appendChild(document.createElement("span"));
    while (overlay.children.length > wanted) overlay.removeChild(overlay.lastChild);
  }

  function toggle() {
    if (root.hasAttribute("data-show-grid")) {
      root.removeAttribute("data-show-grid");
    } else {
      root.setAttribute("data-show-grid", "");
      draw();
    }
  }

  window.addEventListener("keydown", function (event) {
    if (event.key !== "g" && event.key !== "G") return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    var tag = (event.target && event.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || (event.target && event.target.isContentEditable)) return;
    toggle();
  });

  window.addEventListener("resize", function () {
    if (root.hasAttribute("data-show-grid")) draw();
  });

  if (new URLSearchParams(window.location.search).has("grid")) {
    root.setAttribute("data-show-grid", "");
    window.addEventListener("load", draw);
    draw();
  }
})();
