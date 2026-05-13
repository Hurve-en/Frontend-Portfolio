const Utils = (() => {
  const TZ_PRESETS = [
    { id: "local", label: "Local" },
    { id: "UTC", label: "UTC" },
    { id: "America/New_York", label: "New York" },
    { id: "Europe/London", label: "London" },
    { id: "Asia/Tokyo", label: "Tokyo" },
  ];

  function getPartsForZone(date = new Date(), timeZone = "local") {
    const opts = {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "long",
      year: "numeric",
      weekday: "long",
    };
    try {
      const dtf =
        timeZone === "local"
          ? new Intl.DateTimeFormat([], opts)
          : new Intl.DateTimeFormat(
              "en-US",
              Object.assign({}, opts, { timeZone }),
            );
      const parts = dtf.formatToParts(date);
      const out = {};
      parts.forEach((p) => (out[p.type] = p.value));
      if (out.hour) out.hour = out.hour.replace(/[^\d]/g, "").padStart(2, "0");
      if (out.minute)
        out.minute = out.minute.replace(/[^\d]/g, "").padStart(2, "0");
      if (out.second)
        out.second = out.second.replace(/[^\d]/g, "").padStart(2, "0");
      return out;
    } catch (e) {
      const local = new Intl.DateTimeFormat([], opts).formatToParts(date);
      const out = {};
      local.forEach((p) => (out[p.type] = p.value));
      return out;
    }
  }

  function formatTimeFromParts(parts, format24) {
    const h24 = parseInt(parts.hour || "0", 10);
    let displayHour = h24;
    let ampm = "";
    if (!format24) {
      ampm = h24 >= 12 ? "PM" : "AM";
      displayHour = h24 % 12;
      if (displayHour === 0) displayHour = 12;
    }
    const hh = String(displayHour).padStart(2, "0");
    const mm = String(parts.minute || "00").padStart(2, "0");
    const ss = String(parts.second || "00").padStart(2, "0");
    return { timeStr: `${hh}:${mm}:${ss}`, ampm };
  }

  function formatDateFromParts(parts) {
    const wk = parts.weekday || "";
    const mon = parts.month || "";
    const day = parts.day || "";
    const yr = parts.year || "";
    return `${wk}, ${mon} ${day}, ${yr}`;
  }

  function getTzLabel(timezone) {
    return (TZ_PRESETS.find((p) => p.id === timezone) || { label: timezone })
      .label;
  }

  return {
    TZ_PRESETS,
    getPartsForZone,
    formatTimeFromParts,
    formatDateFromParts,
    getTzLabel,
  };
})();
