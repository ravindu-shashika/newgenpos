import React from 'react';
import { DollarSign, Users, Package, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, trend }) => (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{title}</h3>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="content">
            <div className="text-2xl font-bold">{value}</div>
            <p className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'} flex items-center mt-1`}>
                {change} <span className="ml-1">from last month</span>
            </p>
        </div>
    </div>
);

const Dashboard = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Revenue"
                    value="$45,231.89"
                    change="+20.1%"
                    trend="up"
                    icon={DollarSign}
                />
                <StatCard
                    title="Active Customers"
                    value="+2350"
                    change="+180.1%"
                    trend="up"
                    icon={Users}
                />
                <StatCard
                    title="Sales"
                    value="+12,234"
                    change="+19%"
                    trend="up"
                    icon={Package}
                />
                <StatCard
                    title="Active Now"
                    value="+573"
                    change="+201"
                    trend="up"
                    icon={TrendingUp}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="font-semibold leading-none tracking-tight">Overview</h3>
                        <p className="text-sm text-muted-foreground">Monthly revenue overview.</p>
                    </div>
                    <div className="p-6 pt-0 pl-2 h-[300px] flex items-center justify-center text-muted-foreground bg-muted/10 m-4 rounded-md border-dashed border-2">
                        [Chart Placeholder]
                    </div>
                </div>
                <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="font-semibold leading-none tracking-tight">Recent Sales</h3>
                        <p className="text-sm text-muted-foreground">You made 265 sales this month.</p>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="space-y-8">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center">
                                    <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10">
                                        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">U{i}</div>
                                    </div>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">Customer {i}</p>
                                        <p className="text-sm text-muted-foreground">customer{i}@example.com</p>
                                    </div>
                                    <div className="ml-auto font-medium">+$1,999.00</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
