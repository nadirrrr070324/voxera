"use client";

import { useEffect, useState } from "react";
import { ConnectionStatus } from "./ConnectionStatus";

export function AppStatusBar() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetch("/api/engine-status")
      .then((r) => r.json())
      .then((d) => setConnected(Boolean(d.connected)))
      .catch(() => setConnected(false));
  }, []);

  return (
    <div className="lg:mb-0">
      <ConnectionStatus engineConnected={connected} micReady transcriptionActive translationReady />
    </div>
  );
}
