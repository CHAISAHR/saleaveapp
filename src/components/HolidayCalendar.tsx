import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Settings } from "lucide-react";

interface HolidayCalendarProps {
  userRole?: 'employee' | 'manager' | 'admin';
}

export const HolidayCalendar = ({
  userRole = 'employee'
}: HolidayCalendarProps) => {
  // South African public holidays for 2025
  const holidays = [
    {
      id: 1,
      name: "New Year's Day",
      date: "2025-01-01",
      type: "public",
      description: "New Year's Day",
      officeStatus: "closed"
    },
    {
      id: 2,
      name: "Human Rights Day",
      date: "2025-03-21",
      type: "public",
      description: "Human Rights Day",
      officeStatus: "closed"
    },
    {
      id: 3,
      name: "Good Friday",
      date: "2025-04-18",
      type: "public",
      description: "Good Friday",
      officeStatus: "closed"
    },
    {
      id: 4,
      name: "Family Day",
      date: "2025-04-21",
      type: "public",
      description: "Family Day",
      officeStatus: "closed"
    },
    {
      id: 5,
      name: "Freedom Day",
      date: "2025-04-27",
      type: "public",
      description: "Freedom Day",
      officeStatus: "closed"
    },
    {
      id: 6,
      name: "Workers' Day",
      date: "2025-05-01",
      type: "public",
      description: "Workers' Day",
      officeStatus: "closed"
    },
    {
      id: 7,
      name: "Youth Day",
      date: "2025-06-16",
      type: "public",
      description: "Youth Day",
      officeStatus: "closed"
    },
    {
      id: 8,
      name: "National Women's Day",
      date: "2025-08-09",
      type: "public",
      description: "National Women's Day",
      officeStatus: "closed"
    },
    {
      id: 9,
      name: "Heritage Day",
      date: "2025-09-24",
      type: "public",
      description: "Heritage Day",
      officeStatus: "closed"
    },
    {
      id: 10,
      name: "Day of Reconciliation",
      date: "2025-12-16",
      type: "public",
      description: "Day of Reconciliation",
      officeStatus: "closed"
    },
    {
      id: 11,
      name: "Christmas Day",
      date: "2025-12-25",
      type: "public",
      description: "Christmas Day",
      officeStatus: "closed"
    },
    {
      id: 12,
      name: "Day of Goodwill",
      date: "2025-12-26",
      type: "public",
      description: "Day of Goodwill",
      officeStatus: "closed"
    }
  ];

  const publicHolidays = holidays.filter(holiday => holiday.type === 'public');
  const upcomingHolidays = holidays.filter(holiday => new Date(holiday.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);

  const getHolidayType = (type: string) => {
    switch (type) {
      case 'public':
        return {
          variant: 'default' as const,
          label: 'Public Holiday'
        };
      case 'company':
        return {
          variant: 'secondary' as const,
          label: 'Company Holiday'
        };
      default:
        return {
          variant: 'outline' as const,
          label: 'Other'
        };
    }
  };

  const getOfficeStatus = (status: string) => {
    switch (status) {
      case 'closed':
        return {
          color: 'text-red-600',
          label: 'Office Closed'
        };
      case 'optional':
        return {
          color: 'text-blue-600',
          label: 'Optional Attendance'
        };
      default:
        return {
          color: 'text-green-600',
          label: 'Office Open'
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Holiday Calendar</h2>
          <p className="text-gray-600">South African public holidays and office closure dates for 2025</p>
        </div>
        {userRole === 'admin' && (
          <Button variant="outline" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Manage Holidays</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Public Holidays Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarDays className="h-5 w-5" />
                    <span>South African Public Holidays 2025</span>
                  </CardTitle>
                  <CardDescription>Public holidays that exclude leave calculations</CardDescription>
                </div>
                {userRole === 'admin' && (
                  <Badge variant="outline" className="text-xs">
                    <Settings className="h-3 w-3 mr-1" />
                    Admin View
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holiday Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publicHolidays.map(holiday => {
                    const holidayDate = new Date(holiday.date);
                    const statusInfo = getOfficeStatus(holiday.officeStatus);
                    return (
                      <TableRow key={holiday.id}>
                        <TableCell className="font-medium">{holiday.name}</TableCell>
                        <TableCell>
                          {holidayDate.toLocaleDateString('en-ZA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          {holidayDate.toLocaleDateString('en-ZA', {
                            weekday: 'long'
                          })}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Holidays */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Upcoming Holidays</span>
              </CardTitle>
              <CardDescription>Next {upcomingHolidays.length} holidays</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingHolidays.map(holiday => {
                const typeInfo = getHolidayType(holiday.type);
                const statusInfo = getOfficeStatus(holiday.officeStatus);
                return <div key={holiday.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{holiday.name}</h4>
                          <p className="text-sm text-gray-600">{holiday.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <CalendarIcon className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {new Date(holiday.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className={`text-xs ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>
                        <Badge variant={typeInfo.variant} className="text-xs">
                          {typeInfo.label}
                        </Badge>
                      </div>
                    </div>;
              })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Holiday Policy */}
      <Card>
        <CardHeader>
          <CardTitle>Holiday Policy</CardTitle>
          <CardDescription>Important information about company holidays</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Public Holidays</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• All federal public holidays are observed</li>
                <li>• Office is closed on these days</li>
                <li>• No leave deduction required</li>
                <li>• Excluded from leave calculations</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Company Holidays</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Additional days designated by company</li>
                <li>• May include office closure days</li>
                <li>• Advance notice provided</li>
                <li>• Optional attendance events specified</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Leave Calculation</h4>
            <p className="text-sm text-blue-700">
              When calculating leave days, weekends and public holidays are automatically excluded. 
              Only working days are counted towards your leave balance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
