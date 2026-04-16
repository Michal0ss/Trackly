console.log("Trackly działa");

setTimeout(() => {
    const decision = confirm("Do you want to enable Netflix subscription?");

    if (decision) {
        fetch("http://127.0.0.1:8000/subscriptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Netflix",
                price: 29.99,
                currency: "PLN",
                billing_cycle: "monthly",
                next_payment_date: "2024-05-01"
            })
        })
        .then(async response => {
            const text = await response.text();
            console.log("HTTP status:", response.status);
            console.log("Response body:", text);

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${text}`);
            }

            return JSON.parse(text);
        })
        .then(data => console.log("Success:", data))
        .catch(err => console.error("Fetch error:", err));
    }
}, 1000);
