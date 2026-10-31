import type { Transaction } from "@/types/finance";
export function downloadTransactionsCsv(transactions: Transaction[]) {
  const rows = [
    ["日期", "類型", "描述", "分類", "帳戶", "金額"],
    ...transactions.map(({ date, type, description, category, account, amount }) => [
      date,
      type,
      description,
      category,
      account,
      String(amount),
    ]),
  ];
  const csv =
    "\ufeff" +
    rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
  const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = Object.assign(document.createElement("a"), {
    href,
    download: "pocketflow-transactions.csv",
  });
  anchor.click();
  URL.revokeObjectURL(href);
}
