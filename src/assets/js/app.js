// src/assets/js/app.js
// Runs just before Alpine starts. Register named components here.
// Bootstrap owns dropdowns, offcanvas focus trapping, backdrop and scroll locking.
// Keep only the navigation tier pinned as the utility strips scroll away.
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const navigation = header?.querySelector(".header-navigation");
  const menu = document.getElementById("mainNav");
  const toggle = header?.querySelector(".navbar-toggler");
  if (!header || !navigation || !menu || !toggle) return;
  const desktopNavigation = window.matchMedia("(min-width: 1200px)");

  const updateOffset = () => {
    header.style.setProperty(
      "--ac-header-offset",
      `-${navigation.offsetTop}px`,
    );
  };
  updateOffset();
  if ("ResizeObserver" in window) {
    new ResizeObserver(updateOffset).observe(header);
  } else {
    window.addEventListener("resize", updateOffset);
  }
  const closeDropdowns = () => {
    menu.querySelectorAll('[data-bs-toggle="dropdown"]').forEach((button) => {
      bootstrap.Dropdown.getInstance(button)?.hide();
    });
  };
  const closeMenu = () => {
    closeDropdowns();
    bootstrap.Offcanvas.getInstance(menu)?.hide();
  };
  // Offcanvas does not maintain a disclosure's expanded state itself.
  menu.addEventListener("show.bs.offcanvas", () =>
    toggle.setAttribute("aria-expanded", "true"),
  );
  menu.addEventListener("hidden.bs.offcanvas", () => {
    toggle.setAttribute("aria-expanded", "false");
    closeDropdowns();
    // Dispose after a breakpoint dismissal so an overlapping opening animation cannot retain a focus trap.
    if (desktopNavigation.matches) {
      bootstrap.Offcanvas.getInstance(menu)?.dispose();
      if (
        document.activeElement === menu ||
        document.activeElement.matches('[data-bs-dismiss="offcanvas"]')
      ) {
        menu.querySelector(".nav-link")?.focus();
      }
    }
  });
  // Let the first Escape close a submenu before Bootstrap dismisses its panel.
  menu.addEventListener(
    "keydown",
    (event) => {
      const dropdown = menu.querySelector(
        '[data-bs-toggle="dropdown"][aria-expanded="true"]',
      );
      if (event.key === "Escape" && dropdown) {
        event.preventDefault();
        event.stopPropagation();
        closeDropdowns();
        dropdown.focus();
      }
    },
    true,
  );
  // Release the panel when following a destination, including same-page links.
  menu.addEventListener("click", (event) => {
    if (
      event.target.closest("a[href]") &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey
    )
      closeMenu();
  });
  desktopNavigation.addEventListener("change", closeMenu);
});

document.addEventListener("alpine:init", () => {
  // Load and search the generated local index, with retry and query-string support.
  Alpine.data("siteSearch", () => ({
    query: "",
    pages: [],
    results: [],
    ready: false,
    failed: false,
    status: "Enter a topic to search the site.",
    core: null,
    async init() {
      this.query =
        new URLSearchParams(location.search).get("q")?.slice(0, 120) || "";
      await this.load();
    },
    async load() {
      this.failed = false;
      this.ready = false;
      this.status = "Loading the site index…";
      try {
        const [core, response] = await Promise.all([
          import("/assets/js/features-core.js"),
          fetch("/search-index.json"),
        ]);
        if (!response.ok) throw new Error("Index unavailable");
        this.core = core;
        this.pages = await response.json();
        this.ready = true;
        this.search(false);
      } catch {
        this.failed = true;
        this.status = "Search is unavailable. Retry or browse a section below.";
      }
    },
    search(updateUrl = true) {
      this.query = this.query.trim().slice(0, 120);
      if (updateUrl) {
        const url = new URL(location.href);
        if (this.query) url.searchParams.set("q", this.query);
        else url.searchParams.delete("q");
        history.replaceState(null, "", url);
      }
      if (!this.ready) return;
      this.results = this.core.searchPages(this.pages, this.query);
      this.status = !this.query
        ? "Enter a topic to search the site."
        : this.results.length
          ? `${this.results.length} result${this.results.length === 1 ? "" : "s"} for “${this.query}”.`
          : `No results for “${this.query}”. Try a broader topic or browse below.`;
    },
  }));

  // Filter the static demo table and export exactly the matching records.
  Alpine.data("impactDashboard", () => ({
    year: "",
    region: "",
    topic: "",
    records: [],
    ready: false,
    failed: false,
    core: null,
    async init() {
      this.failed = false;
      try {
        this.records = JSON.parse(
          this.$el.querySelector(".impact-records").textContent,
        );
        this.core = await import("/assets/js/features-core.js");
        this.ready = true;
      } catch {
        this.failed = true;
      }
    },
    get selected() {
      return this.core
        ? this.core.filterImpact(this.records, this)
        : this.records;
    },
    get summary() {
      if (!this.ready)
        return "Showing all illustrative records. Loading controls…";
      const screened = this.selected
        .reduce((sum, row) => sum + row.screened, 0)
        .toLocaleString("en");
      const referrals = this.selected
        .reduce((sum, row) => sum + row.referrals, 0)
        .toLocaleString("en");
      return `${this.selected.length} demo ${this.selected.length === 1 ? "record" : "records"} · ${screened} screenings · ${referrals} referrals. Illustrative activity only.`;
    },
    matches(row) {
      return (
        !this.ready ||
        ["year", "region", "topic"].every(
          (key) => !this[key] || String(row[key]) === String(this[key]),
        )
      );
    },
    reset() {
      this.year = "";
      this.region = "";
      this.topic = "";
    },
    download() {
      if (!this.ready || !this.selected.length) return;
      const url = URL.createObjectURL(
        new Blob([this.core.impactCSV(this.selected)], {
          type: "text/csv;charset=utf-8",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "afyacheck-demo-impact.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  }));

  // Shared local enquiries validate natively, then discard all entered details.
  Alpine.data("demoEnquiry", () => ({
    ready: false,
    submitted: false,
    init() {
      this.ready = true;
    },
    complete(form) {
      if (!form.reportValidity()) return;
      form.reset();
      this.submitted = true;
    },
  }));

  // Local newsletter demonstration. No requests, storage or subscription.
  Alpine.data("newsletterForm", () => ({
    ready: false,
    email: "",
    submitted: false,
    init() {
      this.ready = true;
    },
    submit() {
      this.submitted = true;
      this.email = "";
    },
  }));

  // ---- Light / dark mode switch ----
  Alpine.data("themeToggle", () => ({
    dark: false,
    init() {
      try {
        this.dark = localStorage.getItem("theme") === "dark";
      } catch (e) {}
      this.apply();
    },
    toggle() {
      this.setTheme(!this.dark);
    },
    setTheme(dark) {
      this.dark = dark;
      try {
        localStorage.setItem("theme", this.dark ? "dark" : "light");
      } catch (e) {}
      this.apply();
    },
    apply() {
      document.documentElement.setAttribute(
        "data-bs-theme",
        this.dark ? "dark" : "light",
      );
    },
  }));
});
