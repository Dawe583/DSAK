// Vercel serverless funkce pro kontaktní formulář.
// Po nasazení na Vercel nastavte env proměnné:
//   RESEND_API_KEY — API klíč z resend.com (zdarma do 100 e-mailů/den)
//   CONTACT_TO     — cílová schránka (výchozí ahoj@davidsak.cz)
//   CONTACT_FROM   — ověřený odesílatel (výchozí onboarding@resend.dev,
//                    po ověření vlastní domény např. web@davidsak.cz)
// Bez nakonfigurovaného klíče vrací 501 a web automaticky přejde na FormSubmit.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { name, email, term, message, _honey } = req.body || {};
  if (_honey) return res.status(200).json({ ok: true }); // bot past
  if (!name || !email || !message || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Chybí jméno, platný e-mail nebo zpráva." });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(501).json({ error: "Backend není nakonfigurován." });

  const to = process.env.CONTACT_TO || "ahoj@davidsak.cz";
  const from = process.env.CONTACT_FROM || "David Sak Web <onboarding@resend.dev>";

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `Poptávka z webu — ${name}`,
      text: `Jméno: ${name}\nE-mail: ${email}\nTermín: ${term || "neuveden"}\n\n${message}`,
    }),
  });

  if (!r.ok) return res.status(502).json({ error: "Odeslání selhalo." });
  return res.status(200).json({ ok: true });
}
