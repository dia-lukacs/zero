// Date picker: two columns, year and month (written out), each a tube you look
// at from the side. The selected value faces you; the values before and after
// curve away above and below it. Only the year has triangles. When you roll the
// year, the month tube spins one full turn too (back to the same month), like
// two gears. Built for many years.
//
// Use it like this:
//   <div class="date-picker" data-date-picker data-years="2010-2022" data-start="2016-03"></div>
//
// It sends a "datechange" event with { month, year } (month is 1 to 12) each
// time the year changes.
(function () {
  var MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // How far from the selected year a row can be and still show. Further rows are
  // parked just out of sight at this distance.
  var REACH = 3;
  var PARKED = REACH + 1;

  // Both tubes turn by the same angle from one row to the next, so they are the
  // same height and their rows line up.
  var STEP = 22.5;

  function create(tag, className, parent) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.appendChild(node);
    return node;
  }

  function init(root) {
    var years = (root.getAttribute("data-years") || "2010-2022").split("-").map(Number);
    var firstYear = years[0];
    var lastYear = years[1];
    var start = (root.getAttribute("data-start") || firstYear + "-01").split("-").map(Number);

    var state = {
      year: Math.min(lastYear, Math.max(firstYear, start[0])),
      month: start[1],
    };

    // How many full turns the month tube has made. Each year step adds or takes away one.
    var monthTurns = 0;

    var yearColumn = {
      key: "year",
      label: "year",
      count: lastYear - firstYear + 1,
      text: function (i) { return String(firstYear + i); },
      // Angle of row i: rows before the selected year tilt up, rows after tilt down.
      angle: function (i) {
        var distance = i - (state.year - firstYear);
        var parked = Math.max(-PARKED, Math.min(PARKED, distance));
        return -parked * STEP;
      },
      isSelected: function (i) { return i === state.year - firstYear; },
    };

    var monthColumn = {
      key: "month",
      label: "month",
      count: 12,
      text: function (i) { return MONTHS[i]; },
      // The months wrap around: December sits above January and January below
      // December, so there is never a gap next to the selected month. Each month
      // gets its nearest distance to the selected one (-6 to 5 places). Every full
      // turn adds 360 degrees: the same picture, but the tube spins all the way
      // round to get there.
      angle: function (i) {
        var around = ((i - (state.month - 1) + 6) % 12 + 12) % 12 - 6;
        return -around * STEP + 360 * monthTurns;
      },
      isSelected: function (i) { return i === state.month - 1; },
    };

    var columns = [yearColumn, monthColumn];

    root.textContent = "";
    var readout = create("p", "date-picker__readout");
    readout.setAttribute("aria-live", "polite");

    columns.forEach(function (column) {
      var el = create("div", "date-picker__column date-picker__column--" + column.key, root);
      el.setAttribute("role", "group");
      el.setAttribute("aria-label", column.label);

      if (column === yearColumn) {
        column.previous = makeButton(el, "previous", column.label);
        column.next = makeButton(el, "next", column.label);
        column.previous.addEventListener("click", function () { moveYear(-1); });
        column.next.addEventListener("click", function () { moveYear(1); });
      }

      // The tube: one row for every value. Hidden from screen readers, which hear the readout instead.
      column.tube = create("div", "date-picker__tube", el);
      column.tube.setAttribute("aria-hidden", "true");
      column.rows = [];
      for (var i = 0; i < column.count; i += 1) {
        var row = create("span", "date-picker__row", column.tube);
        row.textContent = column.text(i);
        column.rows.push(row);
      }
    });

    root.appendChild(readout);

    function makeButton(parent, direction, label) {
      var button = create("button", "date-picker__arrow date-picker__arrow--" + direction, parent);
      button.type = "button";
      button.setAttribute("aria-label", (direction === "previous" ? "Previous " : "Next ") + label);
      return button;
    }

    function moveYear(step) {
      var next = state.year + step;
      if (next < firstYear || next > lastYear) return;
      state.year = next;
      // One year forward spins the month tube one full turn forward; back spins it back.
      monthTurns += step;
      render();
      root.dispatchEvent(
        new CustomEvent("datechange", {
          bubbles: true,
          detail: { month: state.month, year: state.year },
        })
      );
    }

    function render() {
      columns.forEach(function (column) {
        column.rows.forEach(function (row, i) {
          row.style.setProperty("--date-picker-angle", column.angle(i) + "deg");
          row.classList.toggle("is-selected", column.isSelected(i));
        });
      });
      yearColumn.previous.disabled = state.year <= firstYear;
      yearColumn.next.disabled = state.year >= lastYear;
      readout.textContent = MONTHS[state.month - 1] + " " + state.year;
    }

    render();
  }

  document.querySelectorAll("[data-date-picker]").forEach(init);
})();
