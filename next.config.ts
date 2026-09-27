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
    ];
  },
};

export default nextConfig;
