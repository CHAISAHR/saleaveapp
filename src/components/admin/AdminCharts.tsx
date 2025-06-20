
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const pendingLeavesByDepartment = [
  { name: 'Ops', value: 5, color: '#8884d8' },
  { name: 'Global', value: 8, color: '#82ca9d' },
  { name: 'Finance', value: 3, color: '#ffc658' },
  { name: 'Access', value: 6, color: '#ff7300' },
  { name: 'SHF', value: 4, color: '#8dd1e1' },
];

const departmentData = [
  { department: 'Ops', pending: 5, approved: 15, rejected: 2 },
  { department: 'Global', pending: 8, approved: 22, rejected: 3 },
  { department: 'Finance', pending: 3, approved: 12, rejected: 1 },
  { department: 'Access', pending: 6, approved: 18, rejected: 2 },
  { department: 'SHF', pending: 4, approved: 10, rejected: 1 },
];

export const AdminCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pending Leaves by Department - Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Pending Leaves by Department</span>
          </CardTitle>
          <CardDescription>Current pending leave requests breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pendingLeavesByDepartment}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pendingLeavesByDepartment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Department Status - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Department Status</span>
          </CardTitle>
          <CardDescription>Leave requests status by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pending" fill="#ffc658" />
                <Bar dataKey="approved" fill="#82ca9d" />
                <Bar dataKey="rejected" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
