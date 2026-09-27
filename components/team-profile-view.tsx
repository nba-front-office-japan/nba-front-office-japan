import type { ReactNode } from "react";
import type { Database } from "@/lib/supabase/types";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type TeamProfileRow = Database["public"]["Tables"]["team_profiles"]["Row"];
type TeamArenaRow = Database["public"]["Tables"]["team_arenas"]["Row"];
type StaffRow = Database["public"]["Tables"]["team_staff_members"]["Row"];

// team_profiles が存在しない(テーブル未作成・行が無い)場合だけ「情報準備中」。
// team_profiles はあるが値が空(NULL)の項目は「公式未公表」と表示する。
const PREPARING = "情報準備中";
const NOT_PUBLISHED = "公式未公表";
// ホームアリーナ(team_arenas)で、公式情報からまだ確認できていない項目の表示。
const CHECKING = "確認中";

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
  className = "",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div className={`min-w-0 bg-surface p-4 ${className}`}>
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
  className,
}: {
  label: string;
  value: string | null | undefined;
  sub?: string | null;
  profileMissing: boolean;
  className?: string;
}) {
  if (profileMissing) return <InfoRow label={label} value={PREPARING} muted className={className} />;
  if (!present(value)) return <InfoRow label={label} value={NOT_PUBLISHED} muted className={className} />;
  return <InfoRow label={label} value={value} sub={present(sub) ? sub : null} className={className} />;
}

// "2024-08-28" → "2024年8月"。日付文字列をそのまま分解し、タイムゾーンの影響を受けないようにする。
function formatYearMonth(date: string | null | undefined): string | null {
  const m = present(date) ? /^(\d{4})-(\d{2})/.exec(date) : null;
  return m ? `${m[1]}年${Number(m[2])}月` : null;
}

function SourceLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mr-3 inline-block break-all text-blue underline-offset-2 hover:underline"
        >
          {link.label}
        </a>
      ))}
    </>
  );
}

// ホームアリーナ。アリーナ名は team_profiles、所在地・開場年・収容人数などは team_arenas から出す。
// team_arenas の行が無ければ欄全体を「情報準備中」、行はあるが値が空の項目は「確認中」とする。
function HomeArenaSection({
  profile,
  arena,
}: {
  profile: TeamProfileRow | null;
  arena: TeamArenaRow | null;
}) {
  const nameJa = profile?.arena_name_ja ?? null;
  const nameEn = profile?.arena_name_en ?? null;
  const title = nameJa ?? nameEn ?? "ホームアリーナ";
  const titleSub = nameJa ? nameEn : null;

  if (arena === null) {
    return (
      <SectionCard kicker="Home Arena" title={title}>
        <p className="text-sm text-muted">{PREPARING}</p>
      </SectionCard>
    );
  }

  const locality = [arena.city, [arena.state_region, arena.postal_code].filter(present).join(" ")]
    .filter(present)
    .join(", ");
  const capacitySourceMonth = formatYearMonth(arena.capacity_as_of);
  const capacityLabel =
    present(arena.capacity_source_name) && capacitySourceMonth
      ? `${arena.capacity_source_name}掲載値（${capacitySourceMonth}）`
      : null;

  let officialLink: { href: string; label: string } | null = null;
  if (present(arena.official_url)) {
    const [link] = parseSourceUrls(arena.official_url);
    if (link) officialLink = { href: link.href, label: link.label.replace(/\/$/, "") };
  }

  const locationSources = parseSourceUrls(arena.source_url);
  const capacitySources = parseSourceUrls(arena.capacity_source_url);
  const hasUnconfirmed =
    !present(arena.address) ||
    arena.opened_year === null ||
    arena.capacity_basketball === null ||
    officialLink === null;

  return (
    <SectionCard
      kicker="Home Arena"
      title={
        <>
          {title}
          {present(titleSub) && <span className="text-muted"> / {titleSub}</span>}
        </>
      }
    >
      <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
        {present(arena.address) ? (
          <InfoRow
            label="所在地"
            value={arena.address}
            sub={
              <>
                {locality}
                {present(arena.country) && (
                  <>
                    <br />
                    {arena.country}
                  </>
                )}
              </>
            }
          />
        ) : (
          <InfoRow label="所在地" value={CHECKING} muted />
        )}
        {arena.opened_year !== null ? (
          <InfoRow label="開場年" value={`${arena.opened_year}年`} />
        ) : (
          <InfoRow label="開場年" value={CHECKING} muted />
        )}
        {arena.capacity_basketball !== null ? (
          <InfoRow
            label="収容人数（バスケットボール開催時）"
            value={`${arena.capacity_basketball.toLocaleString("ja-JP")}人`}
            sub={capacityLabel}
          />
        ) : (
          <InfoRow label="収容人数（バスケットボール開催時）" value={CHECKING} muted />
        )}
        <div className="min-w-0 bg-surface p-4 sm:col-span-2 lg:col-span-3">
          <span className="mb-1.5 block text-[11px] text-muted">公式サイト</span>
          {officialLink ? (
            <a
              href={officialLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-[15px] font-semibold text-blue underline-offset-2 hover:underline"
            >
              {officialLink.label} ↗
            </a>
          ) : (
            <b className="text-[15px] font-normal text-muted">{CHECKING}</b>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-muted">
        <p className="font-semibold">出典</p>
        <p>
          ・所在地・開場年：
          {locationSources.length > 0 ? (
            <>
              アリーナ公式サイト（最終確認日 {formatVerifiedDate(arena.last_verified)}）
              <br />
              <span className="ml-3 inline-block">
                <SourceLinks links={locationSources} />
              </span>
            </>
          ) : (
            "—"
          )}
        </p>
        <p>
          ・収容人数：
          {capacitySources.length > 0 ? (
            <>
              {arena.capacity_source_name ?? "—"}（{formatVerifiedDate(arena.capacity_as_of)}掲載、
              {formatVerifiedDate(arena.capacity_last_verified)}確認）
              <br />
              <span className="ml-3 inline-block">
                <SourceLinks links={capacitySources} />
              </span>
            </>
          ) : (
            "—"
          )}
        </p>
        {hasUnconfirmed && <p>「{CHECKING}」は、公式情報でまだ確認できていない項目です。</p>}
      </div>
    </SectionCard>
  );
}

export function TeamProfileView({
  team,
  profile,
  arena,
  assistantCoaches,
}: {
  team: Team;
  profile: TeamProfileRow | null;
  arena: TeamArenaRow | null;
  assistantCoaches: StaffRow[];
}) {
  const profileMissing = profile === null;
  const assistants = [...assistantCoaches].sort((a, b) => a.display_order - b.display_order);
  const sourceLinks = parseSourceUrls(profile?.source_url);

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
          {/* 基本情報は5項目のため、最後の項目を広げて格子の空きマスを作らない */}
          <ProfileRow
            label="Gリーグ提携先"
            value={profile?.g_league_affiliate}
            profileMissing={profileMissing}
            className="sm:col-span-2"
          />
        </div>
      </SectionCard>

      <HomeArenaSection profile={profile} arena={arena} />

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
