// Footer year + form submission via Web3Forms (https://web3forms.com).
// Every <form data-web3forms data-subject="..."> on the site is handled here.
document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

const FALLBACK = "Please email hello@dnbinvestments.com instead.";
const SUCCESS = {
  "Leasing interest list": "Thank you! You're on the list. We'll be in touch when a home becomes available.",
  "Property submission": "Thank you! We've received your property and will review it.",
};

document.querySelectorAll("form[data-web3forms]").forEach((form) => {
  const status = form.querySelector(".form-status");
  const button = form.querySelector('button[type="submit"]');
  const say = (state, text) => { status.dataset.state = state; status.textContent = text; };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) { say("err", "Please fill in the required fields marked with *."); return; }

    const fd = new FormData(form);
    if (fd.get("botcheck")) return; // spam bot filled the hidden box
    const topics = fd.getAll("topics");
    fd.delete("topics");
    fd.delete("botcheck");
    const data = Object.fromEntries(fd.entries());
    data.name = `${data.first_name || ""} ${data.last_name || ""}`.trim();
    if (form.querySelector('[name="topics"]')) data.how_can_we_help = topics.length ? topics.join(", ") : "Not specified";

    const base = form.dataset.subject || "Website inquiry";
    const detail = data.how_can_we_help && data.how_can_we_help !== "Not specified" ? ` (${data.how_can_we_help})` : "";
    data.subject = `${base}${detail} from ${data.name}`;

    if (String(data.access_key).startsWith("YOUR_")) {
      say("err", `This form isn't connected yet. ${FALLBACK}`);
      return;
    }

    button.disabled = true;
    say("", "Sending…");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Submission failed");
      form.reset();
      say("ok", SUCCESS[base] || "Thank you! Your message has been sent.");
    } catch (err) {
      say("err", `Your message didn't send. Please try again. ${FALLBACK}`);
    } finally {
      button.disabled = false;
    }
  });
});

// Resident portal switch (Avail -> Innago). The build already uses the right portal for its build date;
// this flips links in visitors' browsers on the switch date in case the site was not rebuilt.
(() => {
  const root = document.documentElement;
  const when = root.dataset.portalSwitch;
  if (!when || new Date() < new Date(`${when}T00:00:00`)) return;
  document.querySelectorAll("[data-portal-link]").forEach((a) => { a.href = root.dataset.portalNextUrl; });
  document.querySelectorAll("[data-portal-name]").forEach((el) => { el.textContent = root.dataset.portalNextName; });
  document.querySelectorAll("[data-portal-transition]").forEach((el) => { el.hidden = true; });
})();
