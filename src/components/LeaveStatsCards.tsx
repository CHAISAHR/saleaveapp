
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface LeaveRequest {
  id: number;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  submittedDate: string;
  description: string;
}

interface LeaveStatsCardsProps {
  leaveRequests: LeaveRequest[];
}

export const LeaveStatsCards = ({ leaveRequests }: LeaveStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{leaveRequests.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {leaveRequests.filter(r => r.status === 'approved').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {leaveRequests.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Declined</p>
              <p className="text-2xl font-bold text-gray-900">
                {leaveRequests.filter(r => r.status === 'declined').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
