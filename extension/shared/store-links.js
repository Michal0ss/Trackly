const CHROME_STORE_URL = "https://chromewebstore.google.com/detail/trackly/mflggeobolhmojbgmniglaogbehggiap";
const EDGE_STORE_URL = "";

function isEdgeBrowser() {
  return navigator.userAgent.includes("Edg/");
}

function storeReviewUrl() {
  if (isEdgeBrowser()) {
    return EDGE_STORE_URL;
  }

  return `${CHROME_STORE_URL}/reviews`;
}
