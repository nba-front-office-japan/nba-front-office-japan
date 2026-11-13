import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    return [
      // チーム資産価値ランキングは「ランキング」コーナーへ移動した(旧URLは公開済みのため恒久転送)
      {
        source: "/teams/valuations",
        destination: "/rankings/team-valuations",
        permanent: true,
      },
      // CONTRACTS は「サラリー」(/salary)に変わった(旧URLは公開済みのため恒久転送)
      {
        source: "/contracts",
        destination: "/salary",
        permanent: true,
      },
      // 用語辞典の難易度は、ページではなく用語集トップの中の選択にした(2026-11-13)。
      // 難易度別ページ(beginner・intermediate・advanced)と、その前の first・deep は、難易度を選んだ状態の用語集トップへ恒久転送する
      ...(
        [
          ["beginner", "beginner"],
          ["intermediate", "intermediate"],
          ["advanced", "advanced"],
          ["first", "beginner"],
          ["deep", "advanced"],
        ] as const
      ).map(([from, level]) => ({
        source: `/guide/glossary/${from}`,
        destination: `/guide/glossary?level=${level}`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
