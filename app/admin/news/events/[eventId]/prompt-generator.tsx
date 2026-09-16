"use client";

import { useState } from "react";
import { GHOST_BUTTON_CLASS, StatusMessage } from "@/app/admin/_components/action-ui";

export function PromptGenerator({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setFailed(true);
      setCopied(false);
    }
  }

  return (
    <div>
      <textarea
        readOnly
        value={prompt}
        rows={14}
        className="mb-3 w-full border border-line bg-surface px-3 py-2 font-mono text-xs text-foreground"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={handleCopy} className={GHOST_BUTTON_CLASS}>
          プロンプトをコピー
        </button>
        {copied && (
          <StatusMessage state={{ status: "success", message: "コピーしました" }} />
        )}
        {failed && (
          <StatusMessage
            state={{
              status: "error",
              message: "コピーに失敗しました。上のテキストを手動で選択してコピーしてください。",
            }}
          />
        )}
      </div>
    </div>
  );
}
