import * as XLSX from "xlsx";

export function exportToExcel(data: Record<string, unknown>[], headers: Record<string, string>, filename: string) {
  const rows = data.map((item) =>
    Object.fromEntries(
      Object.entries(headers).map(([key, label]) => [label, item[key] ?? ""])
    )
  );

  const ws = XLSX.utils.json_to_sheet(rows);
  
  // Set RTL
  ws["!dir"] = "rtl";
  
  // Auto-size columns
  const colWidths = Object.values(headers).map((h) => {
    const maxLen = Math.max(h.length, ...rows.map((r) => String(r[h] || "").length));
    return { wch: Math.min(maxLen + 4, 40) };
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
