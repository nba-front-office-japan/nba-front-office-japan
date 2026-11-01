import type { ReactNode } from "react";
import styles from "./brief-sheet.module.css";

// 順位表・TEAMS・PLAYERSなどのタブ入口ページで共通の「GM BRIEF」風の資料デザイン。
// 表やカードの配色は変数の読み替えで資料の色にする(brief-sheet.module.css の .sheet)。
export function BriefSheet({
  file,
  mark,
  edition,
  report,
  kicker,
  title,
  lead,
  side,
  children,
}: {
  file: string; // 資料番号(例: 01)
  mark: [string, string]; // ヘッダーの大きな英字。2語目は金色
  edition: string; // 日付行の左(例: 2026-27 REGULAR SEASON)
  report: string; // 日付行の中央
  kicker: ReactNode;
  title: ReactNode;
  lead: ReactNode;
  side?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.sheet}>
      <header className={styles.masthead}>
        <div>
          <span>NBA FRONT OFFICE JAPAN</span>
          <b>FRONT OFFICE FILE / {file}</b>
        </div>
        <p className={styles.mark} aria-hidden>
          {mark[0]}
          <br />
          <i>{mark[1]}</i>
        </p>
        <p className={styles.tagline}>
          DAILY FRONT OFFICE
          <br />
          INTELLIGENCE
        </p>
      </header>
      <div className={styles.dateLine}>
        <b>{edition}</b>
        <span>{report}</span>
        <em>FILE {file}</em>
      </div>
      <div className={side ? styles.leadGrid : undefined}>
        <div className={styles.memo}>
          <p className={styles.kicker}>{kicker}</p>
          <h1>{title}</h1>
          <div className={styles.rule} />
          <div className={styles.lead}>{lead}</div>
        </div>
        {side && <aside className={styles.side}>{side}</aside>}
      </div>
      <div className={styles.body}>{children}</div>
      <footer className={styles.footer}>FOR INFORMATION PURPOSES / NEWS, DATA &amp; FRONT OFFICE CONTEXT</footer>
    </section>
  );
}

// 右の欄の1ブロック。ページごとの補足(集計状況・シーズン切り替えなど)を入れる。
export function BriefSide({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <p className={styles.kicker}>{label}</p>
      <div className={styles.sideBody}>{children}</div>
    </section>
  );
}
