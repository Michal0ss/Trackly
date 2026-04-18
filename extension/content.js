/* global chrome */

console.log("Trackly działa");

setTimeout(() => {
    const decision = confirm("Do you want to enable Netflix subscription?");
    if (!decision) {return;}

    chrome.storage.local.get(["access_token"], async(result) => {
        const token = result.access_token;

        if (!token) {
            console.log("No access token");
            alert("Login to your account");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/subscriptions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: "Netflix",
                    price: 29.99,
                    currency: "PLN",
                    billing_cycle: "monthly",
                    next_payment_date: "2026-05-01"
                })
            });
        const text = await response.json();
        console.log("HTTP response: ", response.status);
        console.log("Response body: ", text);

        if (response.status === 401) {
            alert("Session expired or you are not logged in.");
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${text}`);
        }

        console.log("Success: ", text);
        alert("Subscription was added successfully.");
        }catch(error) {
            console.error("Fetch error: ", error);
            alert("We couldn't log you in.");
        }
    });

}, 1000);
