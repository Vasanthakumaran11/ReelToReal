export default function ItineraryTable({ rows = [] }) {
  let lastDay = null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr className="bg-slate-50 text-ink-900">
            <th scope="col" className="w-16 px-2.5 py-2 font-semibold">Day</th>
            <th scope="col" className="px-2.5 py-2 font-semibold">Activity</th>
            <th scope="col" className="px-2.5 py-2 font-semibold">Location</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const newDay = row.day !== lastDay;
            lastDay = row.day;
            return (
              <tr key={i} className={newDay && i > 0 ? "border-t-2 border-slate-200" : "border-t border-slate-100"}>
                <td className="whitespace-nowrap px-2.5 py-2 align-top font-medium text-ink-700">
                  {newDay ? `Day ${row.day}` : ""}
                </td>
                <td className="px-2.5 py-2 align-top text-ink-900">{row.activity}</td>
                <td className="px-2.5 py-2 align-top text-ink-700">{row.location}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
