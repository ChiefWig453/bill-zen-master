import { DashSession, DashExpense } from '@/types/dash';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, getDay, startOfDay, eachDayOfInterval, subDays } from 'date-fns';

interface DashAnalyticsProps {
  sessions: DashSession[];
  expenses: DashExpense[];
}

export const DashAnalytics = ({ sessions, expenses }: DashAnalyticsProps) => {
  const completedSessions = sessions.filter(s => s.end_time);
  
  // Day of week analysis
  const dayOfWeekData = () => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = Array(7).fill(0).map((_, index) => ({
      day: dayNames[index],
      dayIndex: index,
      totalEarnings: 0,
      totalHours: 0,
      sessionCount: 0,
      averageEarnings: 0,
      averageHourlyRate: 0
    }));

    completedSessions.forEach(session => {
      const dayIndex = getDay(new Date(session.start_time));
      dayStats[dayIndex].totalEarnings += session.total_earnings;
      dayStats[dayIndex].totalHours += session.total_hours || 0;
      dayStats[dayIndex].sessionCount += 1;
    });

    return dayStats.map(stat => ({
      ...stat,
      averageEarnings: stat.sessionCount > 0 ? stat.totalEarnings / stat.sessionCount : 0,
      averageHourlyRate: stat.totalHours > 0 ? stat.totalEarnings / stat.totalHours : 0
    }));
  };

  // Time of day analysis (peak hours)
  const timeOfDayData = () => {
    const hourStats = Array(24).fill(0).map((_, hour) => ({
      hour: `${hour}:00`,
      hourValue: hour,
      totalEarnings: 0,
      sessionCount: 0,
      averageEarnings: 0
    }));

    completedSessions.forEach(session => {
      const startHour = new Date(session.start_time).getHours();
      hourStats[startHour].totalEarnings += session.total_earnings;
      hourStats[startHour].sessionCount += 1;
    });

    return hourStats
      .map(stat => ({
        ...stat,
        averageEarnings: stat.sessionCount > 0 ? stat.totalEarnings / stat.sessionCount : 0
      }))
      .filter(stat => stat.sessionCount > 0); // Only show hours with data
  };

  // Daily trend over last 30 days
  const dailyTrendData = () => {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dayStart = startOfDay(day);
      const daySessions = completedSessions.filter(session => {
        const sessionDate = startOfDay(new Date(session.start_time));
        return sessionDate.getTime() === dayStart.getTime();
      });
      
      const totalEarnings = daySessions.reduce((sum, s) => sum + s.total_earnings, 0);
      const totalHours = daySessions.reduce((sum, s) => sum + (s.total_hours || 0), 0);
      
      return {
        date: format(day, 'MMM dd'),
        earnings: totalEarnings,
        hours: totalHours,
        sessions: daySessions.length
      };
    }).filter(day => day.earnings > 0); // Only show days with earnings
  };

  // Earnings breakdown
  const earningsBreakdownData = () => {
    const totals = completedSessions.reduce((acc, session) => ({
      basePay: acc.basePay + session.base_pay,
      appTips: acc.appTips + session.tips_app,
      cashTips: acc.cashTips + session.tips_cash,
      promotions: acc.promotions + session.promotions
    }), { basePay: 0, appTips: 0, cashTips: 0, promotions: 0 });

    return [
      { name: 'Base Pay', value: totals.basePay, color: 'hsl(var(--primary))' },
      { name: 'App Tips', value: totals.appTips, color: 'hsl(var(--secondary))' },
      { name: 'Cash Tips', value: totals.cashTips, color: 'hsl(var(--accent))' },
      { name: 'Promotions', value: totals.promotions, color: 'hsl(var(--muted))' }
    ].filter(item => item.value > 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const chartConfig = {
    earnings: {
      label: "Earnings",
      color: "hsl(var(--primary))",
    },
    hours: {
      label: "Hours",
      color: "hsl(var(--secondary))",
    },
    hourlyRate: {
      label: "Hourly Rate",
      color: "hsl(var(--accent))",
    },
  };

  const dayData = dayOfWeekData();
  const timeData = timeOfDayData();
  const trendData = dailyTrendData();
  const breakdownData = earningsBreakdownData();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>
      
      {/* Day of Week Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Average Earnings by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayData}>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            <p className="text-primary">
                              Avg Earnings: {formatCurrency(payload[0].value as number)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="averageEarnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Hourly Rate by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayData}>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            <p className="text-accent">
                              Hourly Rate: {formatCurrency(payload[0].value as number)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="averageHourlyRate" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours and Earnings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {timeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Peak Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeData}>
                    <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{label}</p>
                              <p className="text-primary">
                                Avg Earnings: {formatCurrency(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="averageEarnings" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {breakdownData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Earnings Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      labelLine={false}
                    >
                      {breakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{payload[0].name}</p>
                              <p className="text-primary">
                                {formatCurrency(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Daily Trend */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Earnings Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            <p className="text-primary">
                              Earnings: {formatCurrency(data.earnings)}
                            </p>
                            <p className="text-secondary">
                              Hours: {Number(data.hours).toFixed(1)}h
                            </p>
                            <p className="text-muted-foreground">
                              Sessions: {data.sessions}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};