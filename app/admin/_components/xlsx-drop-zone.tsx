"use client";

import { useRef, useState, type DragEvent } from "react";

// Excel(.xlsx)をドラッグ＆ドロップ、またはクリックして選ぶ入力欄。
// 中身はふつうの <input type="file" name={name}>(フォームの送信内容・サーバー側の処理は従来と同じ)。
// ドロップしたファイルはこの input に入れ直すため、フォームの送信方法は変わらない。
// .xlsx 以外は受け付けず、その場で理由を表示する。選んだファイルは名前・大きさと「解除」を表示する。

const ACCEPT = ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function isXlsx(file: File): boolean {
  return /\.xlsx$/i.test(file.name);
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))}KB` : `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function XlsxDropZone({
  name,
  disabled = false,
  onFileChange,
}: {
  name: string;
  disabled?: boolean;
  onFileChange?: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function select(next: File | null) {
    setFile(next);
    onFileChange?.(next);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    setError(null);
    select(null);
    inputRef.current?.focus();
  }

  // 選んだ・ドロップしたファイルを確かめる。.xlsx 以外・複数のときは入力欄を空に戻す
  function accept(files: FileList | null): boolean {
    const list = files ? [...files] : [];
    if (list.length === 0) return false;
    if (list.length > 1) {
      setError("ファイルは1つだけ選んでください。");
    } else if (!isXlsx(list[0])) {
      setError(`「${list[0].name}」は Excel（.xlsx）ではありません。拡張子が .xlsx のファイルを選んでください。`);
    } else {
      setError(null);
      select(list[0]);
      return true;
    }
    if (inputRef.current) inputRef.current.value = "";
    select(null);
    return false;
  }

  function onDragOver(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    if (disabled) return;
    e.dataTransfer.dropEffect = "copy";
    if (!dragging) setDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLLabelElement>) {
    // 枠の中の要素へ移っただけのときは、ドラッグ中の表示を保つ
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDragging(false);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (accept(files) && inputRef.current) {
      // フォームの送信内容に入るよう、ドロップしたファイルを input に入れる
      const dt = new DataTransfer();
      dt.items.add(files[0]);
      inputRef.current.files = dt.files;
    }
  }

  const tone = dragging
    ? "border-blue bg-[#eaf1ff] dark:bg-white/[.08]"
    : file
      ? "border-[#218c68] bg-surface"
      : "border-line bg-surface hover:border-blue hover:bg-[#f6f9ff] dark:hover:bg-white/[.04]";

  return (
    <div className="w-full min-w-0 space-y-2">
      <label
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        data-dragging={dragging || undefined}
        className={`flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-1.5 border-2 border-dashed px-4 py-6 text-center transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue ${tone} ${
          disabled ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={ACCEPT}
          disabled={disabled}
          onChange={(e) => accept(e.currentTarget.files)}
          className="sr-only"
        />
        <span aria-hidden className="text-2xl leading-none">
          {dragging ? "⬇" : "📄"}
        </span>
        <span className="text-sm font-bold">
          {dragging ? "ここにドロップして選択" : "Excel ファイル（.xlsx）をここにドラッグ＆ドロップ"}
        </span>
        <span className="text-xs text-muted">
          または <span className="font-bold text-blue underline underline-offset-2">クリックしてファイルを選ぶ</span>
        </span>
      </label>

      {file && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border border-line bg-surface px-3 py-2 text-sm">
          <p className="min-w-0 break-all">
            <span className="mr-1.5 text-xs font-bold text-[#218c68]">選択中</span>
            <b>{file.name}</b>
            <span className="ml-1.5 text-xs text-muted">（{formatSize(file.size)}）</span>
          </p>
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="shrink-0 border border-line px-3 py-1 text-xs font-bold hover:border-[#cf4a51] hover:text-[#cf4a51] disabled:opacity-60"
          >
            選択を解除
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-semibold text-[#cf4a51]">
          {error}
        </p>
      )}
    </div>
  );
}
