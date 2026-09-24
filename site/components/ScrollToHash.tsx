"use client";

import { useEffect } from "react";

export default function ScrollToHash() {
  useEffect(() => {
    const id = window.location.hash.slice(1);

    if (id) {
      document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
    }
  }, []);

  return null;
}
