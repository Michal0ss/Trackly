const SERVICE_LINKS = [
  { match: ["netflix"], url: "https://www.netflix.com/account" },
  { match: ["spotify"], url: "https://www.spotify.com/account/overview/" },
  { match: ["youtube"], url: "https://www.youtube.com/paid_memberships" },
  { match: ["disney"], url: "https://www.disneyplus.com/account" },
  { match: ["hbo"], url: "https://www.hbomax.com/subscription" },
  { match: ["player"], url: "https://player.pl/moje-konto" },
  { match: ["polsat box go", "polsatboxgo"], url: "https://pomoc.polsatboxgo.pl/pytanie/jak-zrezygnowac-z-subskrypcji/" },
  { match: ["crunchyroll"], url: "https://www.crunchyroll.com/account/membership" },
  { match: ["prime video"], url: "https://www.primevideo.com/settings" },
  { match: ["amazon", "prime"], url: "https://www.amazon.pl/gp/primecentral" },
  { match: ["apple", "icloud", "itunes"], url: "https://support.apple.com/pl-pl/118428" },
  { match: ["tidal"], url: "https://account.tidal.com/subscription" },
  { match: ["deezer"], url: "https://www.deezer.com/account/subscription" },
  { match: ["bookbeat"], url: "https://support.bookbeat.com/hc/pl/articles/205662511" },
  { match: ["legimi"], url: "https://www.legimi.pl/konto/subskrypcja/" },
  { match: ["empik go"], url: "https://www.empik.com/go/faq" },
  { match: ["empik"], url: "https://www.empik.com/premium" },
  { match: ["chatgpt", "openai"], url: "https://help.openai.com/en/articles/7232927" },
  { match: ["claude"], url: "https://claude.ai/settings/billing" },
  { match: ["canva"], url: "https://www.canva.com/help/cancel-canva-plan/" },
  { match: ["notion"], url: "https://www.notion.com/help/upgrade-or-downgrade-your-plan" },
  { match: ["dropbox"], url: "https://www.dropbox.com/account/plan" },
  { match: ["google one"], url: "https://one.google.com/settings" },
  { match: ["duolingo"], url: "https://www.duolingo.com/settings/super" },
  { match: ["adobe"], url: "https://account.adobe.com/plans" },
  { match: ["xbox", "game pass", "microsoft", "office"], url: "https://account.microsoft.com/services" },
  { match: ["github", "copilot"], url: "https://github.com/settings/billing" },
  { match: ["nordvpn"], url: "https://support.nordvpn.com/hc/en-us/articles/19556844985489" },
  { match: ["surfshark"], url: "https://my.surfshark.com/account/subscription" },
  { match: ["proton"], url: "https://account.proton.me/dashboard" },
  { match: ["playstation", "ps plus"], url: "https://www.playstation.com/pl-pl/support/store/cancel-ps-store-subscription/" },
  { match: ["nintendo"], url: "https://ec.nintendo.com/my/membership" },
  { match: ["allegro"], url: "https://allegro.pl/pomoc/dla-kupujacych/rezygnacja-z-allegro-smart/jak-zrezygnowac-z-allegro-smart-gRAre6myduZ" }
];

function findServiceLink(serviceName) {
  const words = String(serviceName || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const padded = ` ${words} `;
  const entry = SERVICE_LINKS.find(({ match }) => match.some((key) => padded.includes(` ${key} `)));

  return entry ? entry.url : null;
}
