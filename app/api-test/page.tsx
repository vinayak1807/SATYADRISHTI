"use client";

import { useEffect, useState } from "react";
import { getCases, Case } from "@/lib/api";

export default function ApiTestPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCases() {
      try {
        const response = await getCases();
        setCases(response.cases);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load cases.",
        );
      }
    }

    loadCases();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        Satyadristi API Test
      </h1>

      {error && (
        <p className="mt-4 text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {cases.map((item) => (
          <div
            key={item.id}
            className="rounded border p-4"
          >
            <p>
              <strong>Case:</strong>{" "}
              {item.caseNumber}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {item.status}
            </p>

            <p>
              <strong>Risk:</strong>{" "}
              {item.riskLevel ?? "N/A"}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}