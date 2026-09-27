import type { ActionsResult } from "@/lib/types";

export function ActionItemsView({ result }: { result: ActionsResult }) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">Summary</h3>
        <p className="m3-card text-sm leading-relaxed text-[var(--md-sys-color-on-surface)]">
          {result.summary}
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">Key Decisions</h3>
        <ul className="flex flex-col gap-2">
          {result.decisions.map((d, i) => (
            <li key={i} className="flex items-start gap-2 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-3 py-2 text-sm text-[var(--md-sys-color-on-surface)]">
              <span className="mt-0.5 text-[var(--md-sys-color-primary)]">●</span> {d}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">Action Items</h3>
        <div className="overflow-hidden m3-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--md-sys-color-surface-container)] text-xs uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              <tr>
                <th className="px-4 py-2.5">Task</th>
                <th className="px-4 py-2.5">Owner</th>
                <th className="px-4 py-2.5">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {result.actionItems.map((item, i) => (
                <tr key={i} className="border-t border-[var(--md-sys-color-outline-variant)]">
                  <td className="px-4 py-2.5 text-[var(--md-sys-color-on-surface)]">{item.task}</td>
                  <td className="px-4 py-2.5 text-[var(--md-sys-color-primary)]">{item.owner}</td>
                  <td className="px-4 py-2.5 text-[var(--md-sys-color-on-surface-variant)]">{item.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">Follow-ups</h3>
        <div className="flex flex-wrap gap-2">
          {result.followUps.map((f, i) => (
            <button
              key={i}
              className="rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] px-3.5 py-1.5 text-xs text-[var(--md-sys-color-on-surface)] transition hover:border-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-surface)]"
            >
              {f}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
