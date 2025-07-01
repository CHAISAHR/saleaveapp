import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Users, AlertCircle, CheckCircle, Calendar } from "lucide-react";

export const PolicyGuide = () => {
  const leaveTypes = [
    {
      type: "Annual Leave",
      allocation: "20 days per year",
      icon: Calendar,
      color: "blue",
      description: "7.1 Annual leave - The employee shall be entitled to 20 (twenty) working days' paid leave in respect of each annual leave cycle (January 1st – December 31st of each year) which shall accrue at 1.66 days per month. The employee is not entitled to take leave for which such leave has not been accrued, unless approved by the employer in writing. Accrued annual leave, can only be carried over to the next annual leave cycle for a maximum period of 6 (six) months after which the staff will forfeit it and no payment shall be made. The employee shall not be entitled to take annual leave during any period of notice, after any notice of termination is given by either party in terms of the termination provisions contained this contract."
    },
    {
      type: "Sick Leave",
      allocation: "36 days per year",
      icon: FileText,
      color: "red",
      description: "7.2 Sick Leave - 7.2.1 The employee shall be entitled to the amount of sick leave provided for in terms of the Basic Conditions of Employment Act 75 of 1997 (\"BCEA\"). During the first six (6) months of employment, an employee is entitled to one (1) day's paid sick leave for every twenty-six (26) days worked. 7.2.2 If the employee is absent from work due to illness for 2 (two) consecutive days or more or on 2 (two) occasions within an 8 (eight) week period, the employee is obliged to supply the employer with a medical certificate issued by a medical practitioner setting out the reasons for their absence from work. 7.2.3 It is the employee's duty to notify both the relevant CHAI manager and provincial manager, of their absence."
    },
    {
      type: "Parental Leave",
      allocation: "20 days",
      icon: Users,
      color: "green",
      description: "7.4 Parental Leave - An employee is entitled to 4 (four) weeks per calendar year of unpaid parental leave in the circumstances provided for in the BCEA, as amended. An employee may commence parental leave on— (a) the day that the employee's child is born; or (b) the date— (i) that the adoption order is granted; or (ii) that a child is placed in the care of a prospective adoptive parent by a competent court, pending the finalisation of an adoption order in respect of that child, whichever date occurs first. An employee must notify the employer in writing, unless the employee is unable to do so, of the date on which the employee intends to commence parental leave and return to work after parental leave. Notification to the employer must be given at least 1 (one) month before the employee's child is expected to be born or, if it is not reasonably practicable to do so, as soon as is reasonably practicable."
    },
    {
      type: "Family Leave",
      allocation: "3 days per year",
      icon: Users,
      color: "orange",
      description: "7.5 Family Responsibility Leave - The employee shall, as per the BCEA, be entitled to three (3) days of Family Responsibility Leave per calendar year."
    },
    {
      type: "Adoption Leave",
      allocation: "20 days",
      icon: Users,
      color: "purple",
      description: "7.6 Adoption and Commissioning Parental Leave - Employees are entitled to 10 (ten) consecutive weeks of leave, or the parental leave referred to above, if: (a) the employee is a commissioning parent in a surrogate motherhood agreement; or (b) the employee is an adoptive parent of a child who is below the age of 2 (two) years. Any leave taken in terms of this provision shall be in compliance with the BCEA, as amended"
    },
    {
      type: "Study Leave",
      allocation: "6 days per year",
      icon: FileText,
      color: "indigo",
      description: "The employee shall be entitled to six (6) days of Study leave per calendar year."
    },
    {
      type: "Wellness Leave",
      allocation: "2 days per year",
      icon: CheckCircle,
      color: "teal",
      description: "The employee shall be entitled to two (2) Wellness days leave per calendar year for mental health and wellbeing purposes."
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      red: "bg-red-100 text-red-800 border-red-200",
      green: "bg-green-100 text-green-800 border-green-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      pink: "bg-pink-100 text-pink-800 border-pink-200",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
      teal: "bg-teal-100 text-teal-800 border-teal-200"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Leave Policy Guide</h2>
        <p className="text-gray-600">Complete information about leave types, policies, and procedures</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leaveTypes.map((leave, index) => {
          const IconComponent = leave.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getColorClasses(leave.color)}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{leave.type}</CardTitle>
                    <CardDescription className="font-medium text-gray-700">
                      {leave.allocation}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Policy Details:</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {leave.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
