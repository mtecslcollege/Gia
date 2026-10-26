/* =====================================================================
   ADMISSION SETTINGS  (js/admission-config.js)
   This ONE file decides whether admission is open or closed for every
   visitor. The Academic Programmes page and the Online Registration page
   both read it.

   mode  "open"   : admission is open (it closes by itself after `closes`, if set)
         "closed" : admission is closed
         "auto"   : opens on `opens` and closes after `closes` (dates: YYYY-MM-DD)

   stages: each school level can follow the general setting ("inherit"),
           or be forced "open" or "closed" (optional `closes` date per level).

   TO CHANGE: open the site with  academic programmes page + #admin  at the end
   of the address (Academic_programs.html#admin), adjust the settings, click
   "Download settings file", then upload it here to replace this file.
   ===================================================================== */
window.GIA_ADMISSION = {
  session: "2026/2027",
  mode: "open",
  opens: "",
  closes: "",
  note: "",
  stages: {
    daycare:      { mode: "inherit", closes: "" },
    kindergarten: { mode: "inherit", closes: "" },
    grade:        { mode: "inherit", closes: "" },
    jss:          { mode: "inherit", closes: "" },
    sss:          { mode: "inherit", closes: "" }
  }
};
