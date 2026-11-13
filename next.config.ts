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
      // 用語辞典の「最初に知る用語」「深掘りする用語」はやめて、初級・上級のリストにした(2026-11-13。旧URLは公開済みのため恒久転送)
      {
        source: "/guide/glossary/first",
        destination: "/guide/glossary/beginner",
        permanent: true,
      },
      {
        source: "/guide/glossary/deep",
        destination: "/guide/glossary/advanced",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
