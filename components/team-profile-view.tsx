import type { ReactNode } from "react";
import type { Database } from "@/lib/supabase/types";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type TeamProfileRow = Database["public"]["Tables"]["team_profiles"]["Row"];
type StaffRow = Database["public"]["Tables"]["team_staff_members"]["Row"];

// team_profiles が存在しない(テーブル未作成・行が無い)場合だけ「情報準備中」。
// team_profiles はあるが値が空(NULL)の項目は「公式未公表」と表示する。
const PREPARING = "情報準備中";
const NOT_PUBLISHED = "公式未公表";

function present(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function formatVerifiedDate(date: string | null | undefined): string {
  if (!present(date)) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// source_url は改行区切りで複数URLが入りうる。http(s)のURLだけをリンクにする。
function parseSourceUrls(sourceUrl: string | null | undefined): { href: string; label: string }[] {
  if (!present(sourceUrl)) return [];
  const seen = new Set<string>();
  const links: { href: string; label: string }[] = [];
  for (const raw of sourceUrl.split(/\r?\n/)) {
    const href = raw.trim();
    if (!href || seen.has(href)) continue;
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    seen.add(href);
    const path = url.pathname === "/" ? "" : url.pathname;
    links.push({ href, label: `${url.hostname.replace(/^www\./, "")}${path}` });
  }
  return links;
}

function SectionCard({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border border-line bg-surface p-4 sm:p-6">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[1.3px] text-blue">
        {kicker}
      </p>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({
  label,
  value,
  sub,
  muted = false,
}: {
  label: string;
  value: string;
  sub?: string | null;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0 bg-surface p-4">
      <span className="mb-1.5 block text-[11px] text-muted">{label}</span>
      <b
        className={`block break-words text-[15px] ${
          muted ? "font-normal text-muted" : "font-semibold"
        }`}
      >
        {value}
      </b>
      {sub && <span className="mt-1 block break-words text-[11px] text-muted">{sub}</span>}
    </div>
  );
}

// 値を持つ項目は通常表示、NULLは「公式未公表」、profile自体が無い場合は「情報準備中」を出す。
function ProfileRow({
  label,
  value,
  sub,
  profileMissing,
}: {
  label: string;
  value: string | null | undefined;
  sub?: string | null;
  profileMissing: boolean;
}) {
  if (profileMissing) return <InfoRow label={label} value={PREPARING} muted />;
  if (!present(value)) return <InfoRow label={label} value={NOT_PUBLISHED} muted />;
  return <InfoRow label={label} value={value} sub={present(sub) ? sub : null} />;
}

export function TeamProfileView({
  team,
  profile,
  assistantCoaches,
}: {
  team: Team;
  profile: TeamProfileRow | null;
  assistantCoaches: StaffRow[];
}) {
  const profileMissing = profile === null;
  const assistants = [...assistantCoaches].sort((a, b) => a.display_order - b.display_order);
  const sourceLinks = parseSourceUrls(profile?.source_url);

  const arenaMain = profile?.arena_name_ja ?? profile?.arena_name_en ?? null;
  const arenaSub = profile?.arena_name_ja ? profile.arena_name_en : null;

  return (
    <div className="space-y-6">
      <SectionCard kicker="Team Info" title={<>基本情報 <span className="text-muted">/ {team.name}</span></>}>
        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow label="チーム名" value={team.name} />
          <InfoRow label="都市" value={team.city} />
          <InfoRow label="カンファレンス / ディビジョン" value={`${team.conference} / ${team.division}`} />
          <InfoRow
            label="創設年"
            value={team.founded_year ? `${team.founded_year}年` : NOT_PUBLISHED}
            muted={!team.founded_year}
          />
          <ProfileRow label="アリーナ" value={arenaMain} sub={arenaSub} profileMissing={profileMissing} />
          <ProfileRow label="Gリーグ提携先" value={profile?.g_league_affiliate} profileMissing={profileMissing} />
        </div>
      </SectionCard>

      <SectionCard kicker="Front Office" title="フロント">
        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          <ProfileRow label="Owner" value={profile?.owner_name} profileMissing={profileMissing} />
          <ProfileRow label="Governor" value={profile?.governor_name} profileMissing={profileMissing} />
          <ProfileRow
            label="Team President"
            value={profile?.team_president_name}
            sub={profile?.team_president_role}
            profileMissing={profileMissing}
          />
          <ProfileRow
            label="Basketball Operations"
            value={profile?.basketball_operations_name}
            sub={profile?.basketball_operations_role}
            profileMissing={profileMissing}
          />
          <ProfileRow label="GM" value={profile?.gm_name} profileMissing={profileMissing} />
        </div>
        {!profileMissing && (
          <p className="mt-3 text-xs text-muted">
            「{NOT_PUBLISHED}」は、公式情報から現在の役職者を確認できていない項目です。
          </p>
        )}
      </SectionCard>

      <SectionCard kicker="Coaching Staff" title="コーチ陣">
        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
          <ProfileRow label="Head Coach" value={profile?.head_coach_name} profileMissing={profileMissing} />
        </div>
        <h3 className="mb-2 mt-5 text-[13px] font-bold">アシスタントコーチ</h3>
        {profileMissing ? (
          <p className="text-sm text-muted">{PREPARING}</p>
        ) : assistants.length === 0 ? (
          <p className="text-sm text-muted">{NOT_PUBLISHED}</p>
        ) : (
          <ol className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {assistants.map((coach) => (
              <li key={coach.id} className="flex min-w-0 items-baseline gap-3 bg-surface p-4">
                <span className="w-5 shrink-0 text-right text-[11px] font-bold text-muted">
                  {coach.display_order}
                </span>
                <div className="min-w-0">
                  <b className="block break-words text-[15px] font-semibold">{coach.name}</b>
                  <span className="mt-0.5 block text-[11px] text-muted">{coach.role_title}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <SectionCard kicker="Verification" title="確認情報">
        {profileMissing ? (
          <p className="text-sm text-muted">{PREPARING}</p>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
            <InfoRow label="最終確認日" value={formatVerifiedDate(profile.last_verified)} />
            <div className="min-w-0 bg-surface p-4 sm:col-span-2">
              <span className="mb-1.5 block text-[11px] text-muted">出典URL</span>
              {sourceLinks.length === 0 ? (
                <b className="text-[15px] font-normal text-muted">—</b>
              ) : (
                <ul className="space-y-1.5">
                  {sourceLinks.map((link) => (
                    <li key={link.href} className="text-[13px]">
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-blue underline-offset-2 hover:underline"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
