"use client";

// 管理画面の操作ボタン・状態表示で共有するスタイルと小さな部品。
// クリック直後(pending)・成功・失敗の3状態を、どのボタンでも同じ見た目と
// 挙動（二重送信防止・aria-live通知）で表現するために集約する。

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export const INITIAL_ACTION_STATE: ActionState = { status: "idle" };

const BASE =
  "text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-px";

export const PRIMARY_BUTTON_CLASS = `${BASE} bg-blue px-4 py-2 text-white hover:bg-[#184fcf] focus-visible:outline-blue active:bg-[#154399]`;

export const GOLD_BUTTON_CLASS = `${BASE} bg-gold px-4 py-2 font-extrabold text-[#182238] hover:bg-[#e0a72e] focus-visible:outline-[#8a5a00] active:bg-[#c9941f]`;

export const DANGER_BUTTON_CLASS = `${BASE} bg-[#cf4a51] px-4 py-2 font-extrabold text-white hover:bg-[#b93f45] focus-visible:outline-[#cf4a51] active:bg-[#a3383d]`;

export const GHOST_BUTTON_CLASS = `${BASE} border border-line bg-surface px-4 py-2 text-foreground hover:bg-[#f6f9ff] focus-visible:outline-blue active:bg-[#eaf1ff] dark:hover:bg-white/[.06] dark:active:bg-white/[.1]`;

export const LINK_CLASS =
  "font-semibold text-blue underline-offset-2 transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

// 成功/失敗メッセージ。role/aria-liveでスクリーンリーダーにも通知する。
export function StatusMessage({ state }: { state: ActionState }) {
  if (state.status === "success") {
    return (
      <span role="status" aria-live="polite" className="text-sm font-semibold text-[#218c68]">
        {state.message}
      </span>
    );
  }
  if (state.status === "error") {
    return (
      <span role="alert" aria-live="assertive" className="text-sm font-semibold text-[#cf4a51]">
        {state.message}
      </span>
    );
  }
  return null;
}
