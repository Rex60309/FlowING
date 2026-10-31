"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { TransactionList } from "@/components/transactions/TransactionList";
import { SelectEnhancer } from "@/components/ui/SelectEnhancer";
import { downloadTransactionsCsv } from "@/lib/csv";
import { daysUntil, localDateString } from "@/lib/date";
import { categoryIcons, expenseCategories, initialState, storageKey } from "@/lib/finance-data";
import {
  applyTransfer,
  getActiveBudgets,
  getExpenseCategories,
  getIncomeCategories,
  moveListItem,
  nextBillingDate,
  orderByPreference,
} from "@/lib/finance-rules";
import { formatTwd } from "@/lib/money";
import { loadFinanceState, saveFinanceState } from "@/lib/storage";
import { localizeRenderedApp } from "@/lib/localization";
import type {
  Account,
  Budget,
  FinanceState,
  Page,
  Subscription,
  Transaction,
  TransactionType,
  Transfer,
} from "@/types/finance";

const nav: { id: Page; zh: string; en: string }[] = [
  { id: "dashboard", zh: "首頁", en: "Home" },
  { id: "transactions", zh: "交易紀錄", en: "Transactions" },
  { id: "budgets", zh: "預算管理", en: "Budgets" },
  { id: "subscriptions", zh: "訂閱管理", en: "Subscriptions" },
  { id: "accounts", zh: "帳戶", en: "Accounts" },
  { id: "categories", zh: "分類管理", en: "Categories" },
];
type Kind = "transaction" | "budget" | "subscription" | "subscription-record" | "account" | null;
type Editable = Transaction | Budget | Subscription | Account | null;
type Theme = "light" | "dark";
type Language = "zh" | "en";
const today = localDateString();
const monthOf = (date: string) => date.slice(0, 7);
const formatMonth = (period: string) => {
  const [year, month] = period.split("-");
  if (year === "all" && month === "all") return "所有期間";
  if (year === "all") return `所有年份 · ${Number(month)} 月`;
  if (month === "all") return `${year} 年 · 全年`;
  return `${year} 年 ${Number(month)} 月`;
};
const isInPeriod = (date: string, period: string) => {
  const [year, month] = period.split("-");
  return (
    (year === "all" || date.slice(0, 4) === year) && (month === "all" || date.slice(5, 7) === month)
  );
};

export default function Home() {
  const [state, setState] = useState<FinanceState>(initialState);
  const [page, setPage] = useState<Page>("dashboard");
  const [modal, setModal] = useState<Kind>(null);
  const [editing, setEditing] = useState<Editable>(null);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TransactionType | "">("");
  const [selectedMonth, setSelectedMonth] = useState(monthOf(today));
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("zh");
  const toastTimer = useRef<number | undefined>(undefined);
  useEffect(() => setState(loadFinanceState()), []);
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("flowing-theme");
    const nextTheme: Theme = savedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);
  useEffect(() => {
    const next = window.localStorage.getItem("flowing-language") === "en" ? "en" : "zh";
    setLanguage(next);
    document.documentElement.lang = next === "en" ? "en" : "zh-Hant";
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  const update = (next: FinanceState) => {
    setState(next);
    saveFinanceState(next);
  };
  const transfer = (transferItem: Omit<Transfer, "id">) => {
    if (transferItem.from === transferItem.to) return notice("轉出與轉入帳戶不可相同");
    const transfer: Transfer = { ...transferItem, id: crypto.randomUUID() };
    update({
      ...state,
      accounts: applyTransfer(state.accounts, transfer),
      transfers: [transfer, ...(state.transfers ?? [])],
    });
    notice("已完成帳戶轉帳，不計入收支統計");
  };
  const addCategory = (type: TransactionType, rawName: string) => {
    const name = rawName.trim();
    const current = type === "expense" ? getExpenseCategories(state) : getIncomeCategories(state);
    if (!name || current.includes(name)) return notice(name ? "分類名稱已存在" : "請輸入分類名稱");
    update({
      ...state,
      [type === "expense" ? "customExpenseCategories" : "customIncomeCategories"]: [
        ...(type === "expense"
          ? (state.customExpenseCategories ?? [])
          : (state.customIncomeCategories ?? [])),
        name,
      ],
    });
    notice(`已新增「${name}」分類`);
  };
  const removeCategory = (type: TransactionType, name: string) => {
    if (
      state.transactions.some((item) => item.category === name) ||
      state.budgets.some((item) => item.category === name)
    )
      return notice("此分類已有交易或預算，無法刪除");
    update({
      ...state,
      [type === "expense" ? "customExpenseCategories" : "customIncomeCategories"]: (type ===
      "expense"
        ? (state.customExpenseCategories ?? [])
        : (state.customIncomeCategories ?? [])
      ).filter((item) => item !== name),
    });
    notice(`已移除「${name}」分類`);
  };
  useEffect(() => {
    const due = state.subscriptions.find((item) => item.status === "啟用中" && item.next <= today);
    if (!due) return;
    const description = `${due.name} 訂閱`,
      recorded = state.transactions.some(
        (item) =>
          item.date === due.next && item.description === description && item.amount === due.amount
      );
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      date: due.next,
      description,
      category: "日常",
      account: due.account,
      amount: due.amount,
      type: "expense",
    };
    update({
      ...state,
      transactions: recorded ? state.transactions : [transaction, ...state.transactions],
      subscriptions: state.subscriptions.map((item) =>
        item.id === due.id ? { ...item, next: nextBillingDate(item.next, item.cycle) } : item
      ),
    });
    notice(recorded ? `已更新「${due.name}」下次扣款日` : `已自動建立「${due.name}」訂閱交易`);
  }, [state]);
  const toggleTheme = () =>
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      window.localStorage.setItem("flowing-theme", next);
      return next;
    });
  const chooseLanguage = (next: Language) => {
    setLanguage(next);
    document.documentElement.lang = next === "en" ? "en" : "zh-Hant";
    window.localStorage.setItem("flowing-language", next);
  };
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => localizeRenderedApp(language));
    return () => window.cancelAnimationFrame(frame);
  });
  const dismissToast = () => {
    window.clearTimeout(toastTimer.current);
    setToast("");
  };
  const notice = (text: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  };
  const setBudgetActive = (category: string, active: boolean) => {
    const current = state.budgets.find((item) => item.category === category);
    const budget = current ? { ...current, active } : { category, limit: 1000, active };
    update({
      ...state,
      budgets: current
        ? state.budgets.map((item) => (item.category === category ? budget : item))
        : [...state.budgets, budget],
    });
    notice(active ? `已啟用「${category}」預算，請設定額度` : `已停用「${category}」預算`);
  };
  const reorderBudgets = (budgetOrder: string[]) => update({ ...state, budgetOrder });
  const reorderSubscriptions = (subscriptions: Subscription[]) =>
    update({ ...state, subscriptions });
  const reorderAccounts = (accounts: Account[]) => update({ ...state, accounts });
  const reorderCategories = (type: TransactionType, order: string[]) =>
    update({
      ...state,
      [type === "expense" ? "expenseCategoryOrder" : "incomeCategoryOrder"]: order,
    });
  const open = (kind: Exclude<Kind, null>, item: Editable = null) => {
    setEditing(item);
    setModal(kind);
  };
  const close = () => {
    setEditing(null);
    setModal(null);
  };
  const months = useMemo(
    () =>
      Array.from(new Set(state.transactions.map((item) => monthOf(item.date))))
        .filter((month) => /^\d{4}-\d{2}$/.test(month))
        .sort((a, b) => b.localeCompare(a)),
    [state.transactions]
  );
  const monthlyTransactions = useMemo(
    () => state.transactions.filter((item) => isInPeriod(item.date, selectedMonth)),
    [state.transactions, selectedMonth]
  );
  const expense = useMemo(
    () =>
      monthlyTransactions
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0),
    [monthlyTransactions]
  );
  const income = useMemo(
    () =>
      monthlyTransactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0),
    [monthlyTransactions]
  );
  const spend = useMemo(
    () =>
      monthlyTransactions
        .filter((item) => item.type === "expense")
        .reduce<
          Record<string, number>
        >((total, item) => ({ ...total, [item.category]: (total[item.category] ?? 0) + item.amount }), {}),
    [monthlyTransactions]
  );
  const filtered = useMemo(
    () =>
      monthlyTransactions
        .filter(
          (item) =>
            (!filter || item.type === filter) &&
            (!query ||
              `${item.description}${item.category}${item.account}`
                .toLowerCase()
                .includes(query.toLowerCase()))
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [monthlyTransactions, query, filter]
  );
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = editing && "id" in editing ? editing.id : crypto.randomUUID();
    if (modal === "transaction") {
      const transaction: Transaction = {
        id,
        date: String(data.get("date")),
        description: String(data.get("description")).trim(),
        category: String(data.get("category")),
        account: String(data.get("account")),
        amount: Number(data.get("amount")),
        type: String(data.get("type")) as TransactionType,
      };
      const duplicate =
        !editing &&
        state.transactions.some(
          (item) =>
            item.date === transaction.date &&
            item.amount === transaction.amount &&
            item.type === transaction.type &&
            item.description.trim().toLowerCase() === transaction.description.toLowerCase()
        );
      if (
        duplicate &&
        !window.confirm(
          `已有一筆相同日期、金額與描述的「${transaction.description}」交易；仍要新增嗎？`
        )
      )
        return;
      update({
        ...state,
        transactions: editing
          ? state.transactions.map((item) => (item.id === id ? transaction : item))
          : [transaction, ...state.transactions],
      });
      setSelectedMonth(monthOf(transaction.date));
    }
    if (modal === "budget") {
      const previous = editing as Budget | null,
        budget = {
          category: String(data.get("category")),
          limit: Number(data.get("limit")),
          active: previous?.active ?? true,
        };
      update({
        ...state,
        budgets: previous
          ? state.budgets.map((item) => (item.category === previous.category ? budget : item))
          : [...state.budgets.filter((item) => item.category !== budget.category), budget],
      });
    }
    if (modal === "subscription") {
      const subscription: Subscription = {
        id,
        name: String(data.get("name")),
        amount: Number(data.get("amount")),
        cycle: String(data.get("cycle")),
        next: String(data.get("next")),
        account: String(data.get("account")),
        status: String(data.get("status")) as Subscription["status"],
      };
      update({
        ...state,
        subscriptions: editing
          ? state.subscriptions.map((item) => (item.id === id ? subscription : item))
          : [...state.subscriptions, subscription],
      });
    }
    if (modal === "subscription-record") {
      const subscription = editing as Subscription,
        date = String(data.get("date")),
        description = `${subscription.name} 訂閱`,
        duplicate = state.transactions.some(
          (item) =>
            item.date === date &&
            item.description === description &&
            item.amount === subscription.amount
        );
      if (duplicate) return notice("這個日期已有相同訂閱交易");
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        date,
        description,
        category: "日常",
        account: subscription.account,
        amount: subscription.amount,
        type: "expense",
      };
      update({
        ...state,
        transactions: [transaction, ...state.transactions],
        subscriptions:
          data.get("advance") === "on"
            ? state.subscriptions.map((item) =>
                item.id === subscription.id
                  ? { ...item, next: nextBillingDate(item.next, item.cycle) }
                  : item
              )
            : state.subscriptions,
      });
      setSelectedMonth(monthOf(date));
    }
    if (modal === "account") {
      const previous = editing as Account | null,
        account: Account = {
          id,
          name: String(data.get("name")),
          type: String(data.get("type")),
          balance: Number(data.get("balance")),
        };
      update({
        ...state,
        accounts: previous
          ? state.accounts.map((item) => (item.id === id ? account : item))
          : [...state.accounts, account],
        transactions:
          previous && previous.name !== account.name
            ? state.transactions.map((item) =>
                item.account === previous.name ? { ...item, account: account.name } : item
              )
            : state.transactions,
        subscriptions:
          previous && previous.name !== account.name
            ? state.subscriptions.map((item) =>
                item.account === previous.name ? { ...item, account: account.name } : item
              )
            : state.subscriptions,
      });
    }
    close();
    notice(
      modal === "subscription-record"
        ? data.get("advance") === "on"
          ? "已補登交易並推進下次扣款日"
          : "已補登交易，未修改下次扣款日"
        : editing
          ? "已更新資料"
          : "已儲存到本機資料"
    );
  };
  const remove = () => {
    if (!modal || !editing) return;
    const label =
      modal === "transaction"
        ? (editing as Transaction).description
        : modal === "subscription"
          ? (editing as Subscription).name
          : modal === "account"
            ? (editing as Account).name
            : (editing as Budget).category;
    if (!window.confirm(`確定刪除「${label}」嗎？此操作無法復原。`)) return;
    if (modal === "account") {
      const account = editing as Account;
      if (
        state.transactions.some((item) => item.account === account.name) ||
        state.subscriptions.some((item) => item.account === account.name)
      )
        return notice("此帳戶仍有交易或訂閱，請先改用其他帳戶");
      update({ ...state, accounts: state.accounts.filter((item) => item.id !== account.id) });
    }
    if (modal === "transaction")
      update({
        ...state,
        transactions: state.transactions.filter((item) => item.id !== (editing as Transaction).id),
      });
    if (modal === "subscription")
      update({
        ...state,
        subscriptions: state.subscriptions.filter(
          (item) => item.id !== (editing as Subscription).id
        ),
      });
    if (modal === "budget")
      update({
        ...state,
        budgets: state.budgets.filter((item) => item.category !== (editing as Budget).category),
      });
    close();
    notice("已刪除資料");
  };
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          Flow<b>ING</b>
          <small>{language === "en" ? "Money, made clear" : "你的金流，一目了然"}</small>
        </div>
        <nav className="nav">
          {nav.map((item) => (
            <button
              className={page === item.id ? "active" : ""}
              key={item.id}
              onClick={() => setPage(item.id)}
            >
              <NavIcon page={item.id} />
              <span className="nav-label">{language === "en" ? item.en : item.zh}</span>
            </button>
          ))}
        </nav>
        <LanguageToggle language={language} onChange={chooseLanguage} />
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </aside>
      <main className="main">
        {page === "dashboard" && (
          <Dashboard
            state={state}
            transactions={monthlyTransactions}
            month={selectedMonth}
            months={months}
            onMonthChange={setSelectedMonth}
            expense={expense}
            income={income}
            spend={spend}
            open={open}
            go={setPage}
          />
        )}
        {page === "transactions" && (
          <>
            <Header eyebrow="收支明細" title="交易紀錄" />
            <div className="toolbar">
              <div className="filters">
                <MonthPicker months={months} value={selectedMonth} onChange={setSelectedMonth} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜尋描述、分類或帳戶"
                />
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as TransactionType | "")}
                >
                  <option value="">所有類型</option>
                  <option value="expense">支出</option>
                  <option value="income">收入</option>
                </select>
              </div>
              <div className="toolbar-actions">
                <span className="hint">
                  {formatMonth(selectedMonth)} · 共 {filtered.length} 筆
                </span>
                <button className="primary" onClick={() => open("transaction")}>
                  ＋ 新增交易
                </button>
              </div>
            </div>
            {filtered.length ? (
              <TransactionList
                transactions={filtered}
                onEdit={(item) => open("transaction", item)}
              />
            ) : (
              <div className="empty">這個月份找不到符合的交易</div>
            )}
            <TransactionTotals transactions={filtered} />
          </>
        )}
        {page === "budgets" && (
          <Budgets
            state={state}
            spend={spend}
            month={selectedMonth}
            months={months}
            onMonthChange={setSelectedMonth}
            open={open}
            setActive={setBudgetActive}
            onReorder={reorderBudgets}
          />
        )}
        {page === "subscriptions" && (
          <Subscriptions state={state} open={open} onReorder={reorderSubscriptions} />
        )}
        {page === "accounts" && (
          <Accounts state={state} open={open} transfer={transfer} onReorder={reorderAccounts} />
        )}
        {page === "categories" && (
          <Categories
            state={state}
            add={addCategory}
            remove={removeCategory}
            onReorder={reorderCategories}
          />
        )}
      </main>
      {modal && (
        <Modal
          kind={modal}
          item={editing}
          accounts={state.accounts.map((item) => item.name)}
          close={close}
          save={save}
          remove={remove}
        />
      )}
      <SelectEnhancer />
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        <span>{toast}</span>
        <button type="button" onClick={dismissToast} aria-label="關閉通知">
          ×
        </button>
      </div>
    </div>
  );
}

function MonthPicker({
  months,
  value,
  onChange,
}: {
  months: string[];
  value: string;
  onChange: (month: string) => void;
}) {
  const [year, month] = value.split("-"),
    dataYears = months.map((item) => Number(item.slice(0, 4))).filter(Number.isFinite),
    firstYear = dataYears.length ? Math.min(...dataYears) : Number(today.slice(0, 4)),
    lastYear = dataYears.length ? Math.max(...dataYears) : Number(today.slice(0, 4)),
    years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) =>
      String(lastYear - index)
    ),
    allMonths = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
  return (
    <div className="month-picker" role="group" aria-label="檢視年月">
      <label className="month-year">
        <span className="picker-label">年</span>
        <select
          value={year}
          onChange={(event) => onChange(`${event.target.value}-${month}`)}
          aria-label="年份"
        >
          <option value="all">全部</option>
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="month-number">
        <span className="picker-label">月</span>
        <select
          value={month}
          onChange={(event) => onChange(`${year}-${event.target.value}`)}
          aria-label="月份"
        >
          <option value="all">全部</option>
          {allMonths.map((item) => (
            <option key={item} value={item}>
              {Number(item)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
function NavIcon({ page }: { page: Page }) {
  const icon =
    page === "dashboard" ? (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v10h14V9" />
        <path d="M9 19v-5h6v5" />
      </>
    ) : page === "transactions" ? (
      <>
        <path d="M7 3v14" />
        <path d="m3 7 4-4 4 4" />
        <path d="M17 21V7" />
        <path d="m13 17 4 4 4-4" />
      </>
    ) : page === "budgets" ? (
      <>
        <rect x="3" y="5" width="18" height="15" rx="3" />
        <path d="M3 10h18" />
        <path d="M16 15h2" />
      </>
    ) : page === "subscriptions" ? (
      <>
        <path d="M20 8a8 8 0 0 0-14-2" />
        <path d="M4 4v4h4" />
        <path d="M4 16a8 8 0 0 0 14 2" />
        <path d="M20 20v-4h-4" />
      </>
    ) : (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </>
    );
  return (
    <span className="nav-icon" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon}
      </svg>
    </span>
  );
}
function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const dark = theme === "dark";
  return (
    <button
      className={`theme-toggle ${dark ? "dark" : ""}`}
      type="button"
      onClick={onToggle}
      aria-pressed={dark}
      aria-label={dark ? "切換為淺色模式" : "切換為深色模式"}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {dark ? (
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </>
          )}
        </svg>
      </span>
      <span className="theme-toggle-copy">
        <small>介面外觀</small>
        <strong>{dark ? "深色模式" : "淺色模式"}</strong>
      </span>
      <span className="theme-toggle-state" aria-hidden="true">
        <i />
      </span>
    </button>
  );
}
function LanguageToggle({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <div className="language-toggle" role="group" aria-label="Language" data-localize-skip>
      <button
        type="button"
        className={language === "zh" ? "active" : ""}
        onClick={() => onChange("zh")}
        aria-pressed={language === "zh"}
      >
        繁體中文
      </button>
      <button
        type="button"
        className={language === "en" ? "active" : ""}
        onClick={() => onChange("en")}
        aria-pressed={language === "en"}
      >
        English
      </button>
    </div>
  );
}
function Header({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="top">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </div>
      {action && (
        <button className="primary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

function TransactionTotals({ transactions }: { transactions: Transaction[] }) {
  const expense = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="transaction-totals" aria-label="篩選結果合計">
      <span className="transaction-totals-label">篩選結果合計</span>
      <div className="transaction-totals-values">
        <div>
          <span>總支出</span>
          <strong className="negative">-{formatTwd(expense)}</strong>
        </div>
        <i aria-hidden="true" />
        <div>
          <span>總收入</span>
          <strong className="positive">+{formatTwd(income)}</strong>
        </div>
      </div>
    </section>
  );
}

function useSortableList<T>(
  items: T[],
  getId: (item: T) => string,
  onReorder: (items: T[]) => void
) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const move = (from: number, to: number) => onReorder(moveListItem(items, from, to));
  const moveTo = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const from = items.findIndex((item) => getId(item) === draggedId);
    const to = items.findIndex((item) => getId(item) === targetId);
    if (from >= 0 && to >= 0) move(from, to);
  };

  return {
    draggedId,
    itemProps: (id: string) => ({
      draggable: true,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        event.dataTransfer.effectAllowed = "move";
        const source = event.currentTarget;
        const preview = source.cloneNode(true) as HTMLElement;
        const bounds = source.getBoundingClientRect();
        preview.classList.remove("is-dragging");
        preview.classList.add("drag-preview");
        preview.style.width = `${bounds.width}px`;
        document.body.append(preview);
        event.dataTransfer.setDragImage(
          preview,
          event.clientX - bounds.left,
          event.clientY - bounds.top
        );
        window.setTimeout(() => preview.remove(), 0);
        setDraggedId(id);
      },
      onDragEnd: () => setDraggedId(null),
      onDragOver: (event: DragEvent<HTMLElement>) => event.preventDefault(),
      onDrop: (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        moveTo(id);
        setDraggedId(null);
      },
    }),
    move,
  };
}

function ReorderControls({
  index,
  total,
  onMove,
  label,
}: {
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  label: string;
}) {
  return (
    <div className="reorder-controls" aria-label={`調整 ${label} 排序`}>
      <button
        type="button"
        className="reorder-button"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
        aria-label={`上移 ${label}`}
        title="上移"
      >
        ↑
      </button>
      <button
        type="button"
        className="reorder-button"
        disabled={index === total - 1}
        onClick={() => onMove(index, index + 1)}
        aria-label={`下移 ${label}`}
        title="下移"
      >
        ↓
      </button>
    </div>
  );
}
function Progress({ value }: { value: number }) {
  return (
    <div className={`progress ${value >= 80 ? "warn" : ""}`}>
      <i style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}
function Metric({
  label,
  value,
  hint,
  feature = false,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  feature?: boolean;
  tone?: "expense" | "income";
}) {
  return (
    <div className={`card ${feature ? "feature" : ""} ${tone ? `metric-${tone}` : ""}`}>
      <div className="label">{label}</div>
      <div className="amount">{value}</div>
      <div className="hint positive">{hint}</div>
    </div>
  );
}
function UpcomingSubscriptionCard({
  items,
  timing,
}: {
  items: (Subscription & { remaining: number })[];
  timing: (remaining: number) => string;
}) {
  return (
    <article className="card upcoming-subscriptions">
      <div className="section-head tight">
        <div className="label">近期訂閱通知</div>
        <span className="upcoming-count">共 {items.length} 筆</span>
      </div>
      {items.length ? (
        <div className="upcoming-subscription-list">
          {items.map((item) => {
            const level =
              item.remaining <= 1 ? "urgent" : item.remaining <= 3 ? "soon" : "upcoming";
            return (
              <div className={`upcoming-subscription ${level}`} key={item.id}>
                <span>{timing(item.remaining)}</span>
                <strong>{item.name}</strong>
                <small>{item.next}</small>
                <b>{formatTwd(item.amount)}</b>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="upcoming-empty">未來 7 天沒有扣款安排</div>
      )}
    </article>
  );
}
function Dashboard({
  state,
  transactions,
  month,
  months,
  onMonthChange,
  expense,
  income,
  spend,
  open,
  go,
}: {
  state: FinanceState;
  transactions: Transaction[];
  month: string;
  months: string[];
  onMonthChange: (month: string) => void;
  expense: number;
  income: number;
  spend: Record<string, number>;
  open: (kind: Exclude<Kind, null>) => void;
  go: (page: Page) => void;
}) {
  state = { ...state, budgets: getActiveBudgets(state.budgets) };
  const total = state.budgets.reduce((sum, item) => sum + item.limit, 0);
  return (
    <>
      <div className="top">
        <div>
          <div className="eyebrow">{formatMonth(month)}</div>
          <h1>{transactions.length ? "收支概況" : "尚無交易紀錄"}</h1>
        </div>
        <div className="actions">
          <MonthPicker months={months} value={month} onChange={onMonthChange} />
          <button className="secondary" onClick={() => downloadTransactionsCsv(transactions)}>
            匯出本月 CSV
          </button>
        </div>
      </div>
      <div className="overview">
        <Metric
          tone="expense"
          label="總支出"
          value={formatTwd(expense)}
          hint={`${transactions.filter((item) => item.type === "expense").length} 筆支出`}
        />
        <Metric
          tone="income"
          label="總收入"
          value={formatTwd(income)}
          hint={`${transactions.filter((item) => item.type === "income").length} 筆收入`}
        />
        <Metric
          label="淨現金流"
          value={formatTwd(income - expense)}
          hint={income >= expense ? "本月有盈餘" : "本月支出較高"}
        />
        <Metric
          label="剩餘預算"
          value={formatTwd(total - expense)}
          hint={`${state.budgets.length} 個分類已設定`}
        />
      </div>
      <div className="grid">
        <SpendingChart transactions={transactions} month={month} />
        <article className="card">
          <div className="section-head">
            <h2>分類支出</h2>
            <button onClick={() => go("transactions")}>查看明細</button>
          </div>
          <div className="categories">
            {Object.entries(spend)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => (
                <div className="cat-row" key={category}>
                  <div className="badge">{categoryIcons[category] ?? "◦"}</div>
                  <div>
                    <strong>{category}</strong>
                    <Progress value={expense ? (amount / expense) * 100 : 0} />
                  </div>
                  <strong>{formatTwd(amount)}</strong>
                </div>
              ))}
            {!Object.keys(spend).length && <p className="empty">本月尚無支出</p>}
          </div>
        </article>
        <article className="card">
          <div className="section-head">
            <h2>預算進度</h2>
            <button onClick={() => go("budgets")}>管理預算</button>
          </div>
          <div className="categories">
            {state.budgets.map((item) => (
              <div key={item.category}>
                <div className="section-head tight">
                  <strong>{item.category}</strong>
                  <span className="hint">
                    {formatTwd(spend[item.category] ?? 0)} / {formatTwd(item.limit)}
                  </span>
                </div>
                <Progress value={((spend[item.category] ?? 0) / item.limit) * 100} />
              </div>
            ))}
          </div>
        </article>
        <article className="card">
          <div className="section-head">
            <h2>最近交易</h2>
            <button onClick={() => go("transactions")}>全部交易</button>
          </div>
          <TransactionList
            compact
            transactions={[...transactions].sort((a, b) => b.date.localeCompare(a.date))}
          />
        </article>
      </div>
    </>
  );
}

function Budgets({
  state,
  spend,
  month,
  months,
  onMonthChange,
  open,
  setActive,
  onReorder,
}: {
  state: FinanceState;
  spend: Record<string, number>;
  month: string;
  months: string[];
  onMonthChange: (month: string) => void;
  open: (kind: Exclude<Kind, null>, item?: Editable) => void;
  setActive: (category: string, active: boolean) => void;
  onReorder: (order: string[]) => void;
}) {
  const allBudgets = orderByPreference(getExpenseCategories(state), state.budgetOrder).map(
    (category) =>
      state.budgets.find((item) => item.category === category) ?? {
        category,
        limit: 1000,
        active: false,
      }
  );
  const alerts = allBudgets
    .map((item) => ({ ...item, used: spend[item.category] ?? 0 }))
    .filter((item) => item.active !== false && item.limit > 0 && item.used / item.limit >= 0.8);
  const sortable = useSortableList(
    allBudgets,
    (item) => item.category,
    (items) => onReorder(items.map((item) => item.category))
  );
  return (
    <>
      <div className="top">
        <div>
          <div className="eyebrow">{formatMonth(month)}</div>
          <h1>預算管理</h1>
          <p className="modal-note">所有支出分類都會列出，可依需要啟用並設定額度。</p>
        </div>
        <div className="actions">
          <MonthPicker months={months} value={month} onChange={onMonthChange} />
        </div>
      </div>
      {alerts.length > 0 && (
        <section className="budget-alert" role="status">
          <strong>預算提醒</strong>
          <span>
            {alerts
              .map((item) =>
                item.used >= item.limit
                  ? `${item.category} 已超支 ${formatTwd(item.used - item.limit)}`
                  : `${item.category} 剩餘 ${formatTwd(item.limit - item.used)}`
              )
              .join(" · ")}
          </span>
        </section>
      )}
      <div className="budget-list">
        {allBudgets.map((item, index) => {
          const enabled = item.active !== false,
            used = spend[item.category] ?? 0,
            percent = enabled && item.limit > 0 ? (used / item.limit) * 100 : 0;
          return (
            <article
              className={`budget-item reorderable ${enabled ? "" : "disabled"} ${sortable.draggedId === item.category ? "is-dragging" : ""}`}
              key={item.category}
              {...sortable.itemProps(item.category)}
            >
              <header>
                <strong>
                  {categoryIcons[item.category] ?? "◦"}　{item.category}
                </strong>
                <div className="item-actions">
                  <span className={`budget-status ${enabled ? "on" : ""}`}>
                    {enabled ? "啟用中" : "未啟用"}
                  </span>
                  <button
                    className="icon-button"
                    onClick={() => setActive(item.category, !enabled)}
                  >
                    {enabled ? "停用" : "啟用"}
                  </button>
                  <button className="icon-button" onClick={() => open("budget", item)}>
                    編輯
                  </button>
                  <ReorderControls
                    index={index}
                    total={allBudgets.length}
                    onMove={sortable.move}
                    label={item.category}
                  />
                </div>
              </header>
              {enabled ? (
                <>
                  <p>
                    已使用 {formatTwd(used)}，預算上限 {formatTwd(item.limit)} ·{" "}
                    {Math.round(percent)}%
                  </p>
                  <Progress value={percent} />
                </>
              ) : (
                <p>尚未納入預算計算；啟用後可設定每期額度。</p>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
function Subscriptions({
  state,
  open,
  onReorder,
}: {
  state: FinanceState;
  open: (kind: Exclude<Kind, null>, item?: Editable) => void;
  onReorder: (subscriptions: Subscription[]) => void;
}) {
  const active = state.subscriptions.filter((item) => item.status === "啟用中");
  const monthly = active.reduce(
    (sum, item) =>
      sum +
      (item.cycle === "每年"
        ? item.amount / 12
        : item.cycle === "每週"
          ? (item.amount * 52) / 12
          : item.amount),
    0
  );
  const next = [...active].sort((a, b) => a.next.localeCompare(b.next))[0];
  const upcoming = active
    .map((item) => ({ ...item, remaining: daysUntil(item.next) }))
    .filter((item) => item.remaining >= 0 && item.remaining <= 7)
    .sort((a, b) => a.remaining - b.remaining);
  const timing = (remaining: number) =>
    remaining === 0 ? "今天扣款" : remaining === 1 ? "明天扣款" : `${remaining} 天後扣款`;
  const sortable = useSortableList(state.subscriptions, (item) => item.id, onReorder);
  return (
    <>
      <Header
        eyebrow="固定支出"
        title="訂閱管理"
        action="＋ 新增訂閱"
        onAction={() => open("subscription")}
      />
      <div className="overview subscription-kpis">
        <Metric
          feature
          label="預估月成本"
          value={formatTwd(monthly)}
          hint={`${active.length} 個啟用中的訂閱，已換算年繳與週繳`}
        />
        <UpcomingSubscriptionCard items={upcoming} timing={timing} />
      </div>
      <div className="subscription-list">
        {state.subscriptions.map((item, index) => {
          const remaining = daysUntil(item.next);
          return (
            <article
              className={`sub-item reorderable ${sortable.draggedId === item.id ? "is-dragging" : ""}`}
              key={item.id}
              {...sortable.itemProps(item.id)}
            >
              <header>
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    {item.cycle} · {item.account}
                  </p>
                </div>
                <div className="right">
                  <strong>{formatTwd(item.amount)}</strong>
                  <p>{item.status}</p>
                </div>
              </header>
              <div className="section-head tight">
                <span
                  className={`hint ${remaining < 0 ? "negative" : remaining <= 3 ? "due-soon" : ""}`}
                >
                  下次扣款：{item.next} ·{" "}
                  {remaining < 0 ? "已逾期" : remaining === 0 ? "今天" : `${remaining} 天後`}
                </span>
                <div className="item-actions">
                  <button className="icon-button" onClick={() => open("subscription-record", item)}>
                    補登交易
                  </button>
                  <button className="icon-button" onClick={() => open("subscription", item)}>
                    編輯
                  </button>
                  <ReorderControls
                    index={index}
                    total={state.subscriptions.length}
                    onMove={sortable.move}
                    label={item.name}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
function Accounts({
  state,
  open,
  transfer,
  onReorder,
}: {
  state: FinanceState;
  open: (kind: Exclude<Kind, null>, item?: Editable) => void;
  transfer: (item: Omit<Transfer, "id">) => void;
  onReorder: (accounts: Account[]) => void;
}) {
  const sortable = useSortableList(state.accounts, (item) => item.id, onReorder);
  return (
    <>
      <Header
        eyebrow="付款來源"
        title="帳戶管理"
        action="＋ 新增帳戶"
        onAction={() => open("account")}
      />
      <p className="modal-note">
        修改帳戶名稱會一併更新相關交易與訂閱；使用中的帳戶須先整理關聯資料才能刪除。
      </p>
      <TransferPanel
        accounts={state.accounts}
        transfers={state.transfers ?? []}
        onTransfer={transfer}
      />
      <DataTools />
      <div className="account-grid">
        {state.accounts.map((item, index) => (
          <article
            className={`account reorderable ${sortable.draggedId === item.id ? "is-dragging" : ""}`}
            key={item.id}
            {...sortable.itemProps(item.id)}
          >
            <div className="section-head tight">
              <div className="icon">
                {item.type === "信用卡" ? "▣" : item.type === "現金" ? "◫" : "◇"}
              </div>
              <div className="item-actions">
                <button className="icon-button" onClick={() => open("account", item)}>
                  編輯
                </button>
                <ReorderControls
                  index={index}
                  total={state.accounts.length}
                  onMove={sortable.move}
                  label={item.name}
                />
              </div>
            </div>
            <h3>{item.name}</h3>
            <div className="hint">{item.type}</div>
            <div className="amount account-amount">{formatTwd(item.balance)}</div>
          </article>
        ))}
      </div>
    </>
  );
}
function Categories({
  state,
  add,
  remove,
  onReorder,
}: {
  state: FinanceState;
  add: (type: TransactionType, name: string) => void;
  remove: (type: TransactionType, name: string) => void;
  onReorder: (type: TransactionType, order: string[]) => void;
}) {
  const [type, setType] = useState<TransactionType>("expense"),
    [name, setName] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    add(type, name);
    setName("");
  };
  const custom =
    type === "expense"
      ? (state.customExpenseCategories ?? [])
      : (state.customIncomeCategories ?? []);
  const categories = type === "expense" ? getExpenseCategories(state) : getIncomeCategories(state);
  const sortable = useSortableList(
    categories,
    (item) => item,
    (items) => onReorder(type, items)
  );
  return (
    <>
      <Header eyebrow="個人化設定" title="分類管理" />
      <section className="category-manager">
        <div>
          <div className="eyebrow">新增自訂分類</div>
          <h2>依你的記帳習慣建立分類</h2>
          <p>自訂分類會立即出現在新增交易的分類選單中。</p>
        </div>
        <form onSubmit={submit}>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as TransactionType)}
            aria-label="分類類型"
          >
            <option value="expense">支出分類</option>
            <option value="income">收入分類</option>
          </select>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：寵物、進修"
            maxLength={16}
            required
          />
          <button className="primary">新增分類</button>
        </form>
      </section>
      <section className="category-section">
        <div className="section-head">
          <h2>{type === "expense" ? "支出分類" : "收入分類"}</h2>
          <span className="hint">內建分類不可刪除</span>
        </div>
        <div className="category-chips">
          {categories.map((item, index) => (
            <div
              className={`category-chip reorderable ${custom.includes(item) ? "" : "fixed"} ${sortable.draggedId === item ? "is-dragging" : ""}`}
              key={item}
              {...sortable.itemProps(item)}
            >
              <span>
                {categoryIcons[item] ?? "◦"} {item}
              </span>
              {custom.includes(item) && (
                <button onClick={() => remove(type, item)} aria-label={`刪除 ${item} 分類`}>
                  ×
                </button>
              )}
              <ReorderControls
                index={index}
                total={categories.length}
                onMove={sortable.move}
                label={item}
              />
            </div>
          ))}
        </div>
        {!custom.length && <p className="hint category-empty">尚未建立自訂分類。</p>}
      </section>
    </>
  );
}
function TransferPanel({
  accounts,
  transfers,
  onTransfer,
}: {
  accounts: Account[];
  transfers: Transfer[];
  onTransfer: (item: Omit<Transfer, "id">) => void;
}) {
  const [from, setFrom] = useState(accounts[0]?.name ?? ""),
    [to, setTo] = useState(accounts[1]?.name ?? ""),
    [amount, setAmount] = useState(""),
    [note, setNote] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(amount);
    if (!from || !to || !Number.isFinite(value) || value <= 0) return;
    onTransfer({ from, to, amount: value, note: note.trim() || undefined, date: today });
    setAmount("");
    setNote("");
  };
  return (
    <section className="transfer-panel">
      <div>
        <div className="eyebrow">帳戶轉帳</div>
        <strong>移動資金，不列入收支</strong>
        <p>帳戶餘額會同步更新，並保留最近轉帳紀錄。</p>
      </div>
      <form onSubmit={submit}>
        <select
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          aria-label="轉出帳戶"
        >
          {accounts.map((account) => (
            <option key={account.id}>{account.name}</option>
          ))}
        </select>
        <span aria-hidden="true">→</span>
        <select value={to} onChange={(event) => setTo(event.target.value)} aria-label="轉入帳戶">
          {accounts.map((account) => (
            <option key={account.id}>{account.name}</option>
          ))}
        </select>
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          type="number"
          min="1"
          placeholder="金額"
          aria-label="轉帳金額"
          required
        />
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="備註（選填）"
          aria-label="轉帳備註"
        />
        <button className="primary">確認轉帳</button>
      </form>
      {transfers.length > 0 && (
        <div className="transfer-history">
          {transfers.slice(0, 3).map((item) => (
            <span key={item.id}>
              {item.date} · {item.from} → {item.to} · {formatTwd(item.amount)}
              {item.note ? ` · ${item.note}` : ""}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function Modal({
  kind,
  item,
  accounts,
  close,
  save,
  remove,
}: {
  kind: Exclude<Kind, null>;
  item: Editable;
  accounts: string[];
  close: () => void;
  save: (event: FormEvent<HTMLFormElement>) => void;
  remove: () => void;
}) {
  const value = item ?? {},
    editing = !!item,
    title = `${editing ? "編輯" : "新增"}${{ transaction: "交易", budget: "分類預算", subscription: "訂閱", "subscription-record": "訂閱交易", account: "帳戶" }[kind]}`;
  const [transactionType, setTransactionType] = useState<TransactionType>(
    (value as Transaction).type ?? "expense"
  );
  if (kind === "subscription-record")
    return (
      <SubscriptionRecordModal subscription={item as Subscription} close={close} save={save} />
    );
  const categoryState = loadFinanceState();
  const transactionCategories =
    transactionType === "expense"
      ? getExpenseCategories(categoryState)
      : getIncomeCategories(categoryState);
  const budgetCategories = getExpenseCategories(categoryState);
  const currentCategory = (value as Transaction).category;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog">
        <h2>{title}</h2>
        {editing && <p className="modal-note">儲存後會立即更新本機資料；刪除無法復原。</p>}
        <form onSubmit={save}>
          <div className="form">
            {kind === "transaction" && (
              <>
                <Field label="類型">
                  <select
                    name="type"
                    value={transactionType}
                    onChange={(event) => setTransactionType(event.target.value as TransactionType)}
                  >
                    <option value="expense">支出</option>
                    <option value="income">收入</option>
                  </select>
                </Field>
                <Field label="金額">
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    required
                    defaultValue={(value as Transaction).amount}
                  />
                </Field>
                <Field label="分類">
                  <select
                    key={transactionType}
                    name="category"
                    defaultValue={
                      transactionCategories.includes(currentCategory)
                        ? currentCategory
                        : transactionCategories[0]
                    }
                  >
                    {transactionCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </Field>
                <AccountOptions accounts={accounts} value={(value as Transaction).account} />
                <Field label="日期">
                  <input
                    name="date"
                    type="date"
                    defaultValue={(value as Transaction).date ?? today}
                    required
                  />
                </Field>
                <Field label="描述" wide>
                  <input
                    name="description"
                    required
                    defaultValue={(value as Transaction).description}
                  />
                </Field>
              </>
            )}
            {kind === "budget" && (
              <>
                <Field label="分類">
                  <select name="category" defaultValue={(value as Budget).category}>
                    {expenseCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </Field>
                <Field label="本月預算">
                  <input
                    name="limit"
                    type="number"
                    min="1"
                    required
                    defaultValue={(value as Budget).limit}
                  />
                </Field>
              </>
            )}
            {kind === "subscription" && (
              <>
                <Field label="服務名稱">
                  <input name="name" required defaultValue={(value as Subscription).name} />
                </Field>
                <Field label="每期金額">
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    required
                    defaultValue={(value as Subscription).amount}
                  />
                </Field>
                <Field label="計費週期">
                  <select name="cycle" defaultValue={(value as Subscription).cycle ?? "每月"}>
                    <option>每月</option>
                    <option>每年</option>
                    <option>每週</option>
                  </select>
                </Field>
                <AccountOptions accounts={accounts} value={(value as Subscription).account} />
                <Field label="下次扣款日">
                  <input
                    name="next"
                    type="date"
                    defaultValue={(value as Subscription).next ?? "2026-11-01"}
                    required
                  />
                </Field>
                <Field label="狀態">
                  <select name="status" defaultValue={(value as Subscription).status ?? "啟用中"}>
                    <option>啟用中</option>
                    <option>已暫停</option>
                  </select>
                </Field>
              </>
            )}
            {kind === "account" && (
              <>
                <Field label="帳戶名稱">
                  <input name="name" required defaultValue={(value as Account).name} />
                </Field>
                <Field label="帳戶類型">
                  <select name="type" defaultValue={(value as Account).type ?? "銀行帳戶"}>
                    <option>銀行帳戶</option>
                    <option>現金</option>
                    <option>信用卡</option>
                    <option>電子支付</option>
                  </select>
                </Field>
                <Field label="目前餘額" wide>
                  <input
                    name="balance"
                    type="number"
                    defaultValue={(value as Account).balance ?? 0}
                    required
                  />
                </Field>
              </>
            )}
          </div>
          <div className="dialog-foot">
            {editing && (
              <button type="button" className="danger" onClick={remove}>
                刪除
              </button>
            )}
            <button type="button" className="secondary" onClick={close}>
              取消
            </button>
            <button className="primary">儲存變更</button>
          </div>
        </form>
      </div>
    </div>
  );
}
function SubscriptionRecordModal({
  subscription,
  close,
  save,
}: {
  subscription: Subscription;
  close: () => void;
  save: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="補登訂閱交易">
      <div className="dialog subscription-record-dialog">
        <div className="eyebrow">手動補登</div>
        <h2>{subscription.name}</h2>
        <p className="modal-note">用於補齊漏記的扣款；預設不會影響既有排程。</p>
        <form onSubmit={save}>
          <div className="form">
            <Field label="入帳日期" wide>
              <input name="date" type="date" defaultValue={subscription.next} required />
            </Field>
            <label className="schedule-choice wide">
              <input name="advance" type="checkbox" />
              <span>
                <strong>同時推進下一次扣款日</strong>
                <small>
                  僅在這筆就是原定本期扣款時勾選；下次日期將從 {subscription.next} 往後推進。
                </small>
              </span>
            </label>
          </div>
          <div className="dialog-foot">
            <button type="button" className="secondary" onClick={close}>
              取消
            </button>
            <button className="primary">補登交易</button>
          </div>
        </form>
      </div>
    </div>
  );
}
function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={wide ? "wide" : ""}>
      {label}
      {children}
    </label>
  );
}
function AccountOptions({ accounts, value }: { accounts: string[]; value?: string }) {
  return (
    <Field label="帳戶">
      <select name="account" defaultValue={value}>
        {accounts.map((account) => (
          <option key={account}>{account}</option>
        ))}
      </select>
    </Field>
  );
}
function DataTools() {
  const input = useRef<HTMLInputElement>(null);
  const download = () => {
    const blob = new Blob([JSON.stringify(loadFinanceState(), null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = `pocketflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const restore = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (
          !Array.isArray(data.transactions) ||
          !Array.isArray(data.accounts) ||
          !Array.isArray(data.budgets) ||
          !Array.isArray(data.subscriptions)
        )
          throw new Error();
        localStorage.setItem(storageKey, JSON.stringify(data));
        window.location.reload();
      } catch {
        window.alert("備份檔格式不正確，未變更任何資料。");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };
  const reset = () => {
    if (window.confirm("確定要清除目前本機資料並恢復示範資料嗎？此操作無法復原。")) {
      localStorage.removeItem(storageKey);
      window.location.reload();
    }
  };
  return (
    <section className="data-tools">
      <div>
        <strong>資料備份與還原</strong>
        <p>資料只存放在此瀏覽器，建議定期備份。</p>
      </div>
      <div>
        <button className="secondary" onClick={download}>
          匯出備份
        </button>
        <button className="secondary" onClick={() => input.current?.click()}>
          還原備份
        </button>
        <button className="text-danger" onClick={reset}>
          重設示範資料
        </button>
        <input
          ref={input}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={restore}
        />
      </div>
    </section>
  );
}
