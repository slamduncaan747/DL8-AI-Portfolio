import type { ReactNode } from "react";

/** Building blocks for a project write-up page. */
export function Article({ title, subtitle, accent, children }: { title: string; subtitle: string; accent: string; children: ReactNode }) {
  return (
    <article className="container pb-24 pt-12 sm:pt-16">
      <div className="max-w-[760px]">
        <p className="label" style={{ color: accent }}>
          Write-up
        </p>
        <h1 className="mt-3">{title}</h1>
        <p className="mt-4 text-[18px] leading-relaxed">{subtitle}</p>
        {children}
      </div>
    </article>
  );
}

export function Facts({ items, accent }: { items: Array<[string, string]>; accent: string }) {
  return (
    <dl className="mt-10 grid grid-cols-2 border-y border-[var(--border)] sm:grid-cols-4">
      {items.map(([v, l], i) => (
        <div key={l} className={`border-[var(--border)] py-5 ${i % 2 ? "border-l pl-5" : "pr-5"} sm:border-l sm:pl-5 sm:first:border-l-0 sm:first:pl-0`}>
          <dt className="sr-only">{l}</dt>
          <dd className="font-mono text-[24px] font-semibold leading-none tracking-tight" style={{ color: i === 0 ? accent : undefined }}>
            {v}
          </dd>
          <dd className="mt-2 text-[13px] leading-snug text-[var(--gray-light)]">{l}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Sec({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-[22px]">{title}</h2>
      <div className="mt-3 flex flex-col gap-4 text-[16px] leading-relaxed text-[var(--gray)] [&_code]:rounded [&_code]:bg-[var(--bg-card)] [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13.5px] [&_code]:text-[var(--black)]">
        {children}
      </div>
    </section>
  );
}

export function Table({ head, rows }: { head: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[14.5px]">
        <thead>
          <tr className="border-b border-[var(--black)]">
            {head.map((h) => (
              <th key={h} className="label py-2 pr-4 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[var(--border)] align-top">
              {r.map((c, j) => (
                <td key={j} className={`py-2.5 pr-4 ${j === 0 ? "whitespace-nowrap font-medium text-[var(--black)]" : "text-[var(--gray)]"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
