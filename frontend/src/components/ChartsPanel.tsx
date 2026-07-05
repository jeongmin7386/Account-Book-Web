import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";

import type { ChartItem, DailyTrendItem } from "../types";
import { formatCurrency } from "../utils/format";

interface ChartsPanelProps {
  categorySpending: ChartItem[];
  paymentMethodSpending: ChartItem[];
  dailySpending: DailyTrendItem[];
}

export function ChartsPanel({ categorySpending, paymentMethodSpending, dailySpending }: ChartsPanelProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <ChartBox title="카테고리별 소비 비율">
        {categorySpending.length ? (
          <ResponsiveContainer height={250} width="100%">
            <PieChart>
              <Pie data={categorySpending} dataKey="value" innerRadius={54} outerRadius={90} paddingAngle={2}>
                {categorySpending.map((entry) => (
                  <Cell fill={entry.color ?? "#64748b"} key={entry.name} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartBox>
      <ChartBox title="결제수단별 소비 금액">
        {paymentMethodSpending.length ? (
          <ResponsiveContainer height={250} width="100%">
            <BarChart data={paymentMethodSpending}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(value) => `${Math.round(Number(value) / 10000)}만`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {paymentMethodSpending.map((entry) => (
                  <Cell fill={entry.color ?? "#475569"} key={entry.name} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartBox>
      <ChartBox title="일자별 소비 추이">
        {dailySpending.length ? (
          <ResponsiveContainer height={250} width="100%">
            <LineChart data={dailySpending}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(value) => `${Math.round(Number(value) / 10000)}만`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line dataKey="amount" dot={false} stroke="#0f766e" strokeWidth={3} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartBox>
    </section>
  );
}

function ChartBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[250px] items-center justify-center rounded-lg bg-slate-50 text-sm font-medium text-slate-400">
      표시할 데이터 없음
    </div>
  );
}
