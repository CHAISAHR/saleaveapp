import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Users, AlertCircle, CheckCircle, Calendar } from "lucide-react";
export const PolicyGuide = () => {
  const leaveTypes = [{
    type: "Annual Leave",
    allocation: "20 days per year",
    accrual: "1.66 days per month",
    carryOver: "Expires 6 months after leave year end",
    eligibility: "All permanent employees",
    requirements: "2 weeks advance notice for planned leave",
    icon: Calendar,
    color: "blue"
  }, {
    type: "Sick Leave",
    allocation: "36 days per year",
    accrual: "Full allocation at year start",
    carryOver: "No expiry",
    eligibility: "All employees from day one",
    requirements: "Medical certificate required for >3 consecutive days",
    icon: FileText,
    color: "red"
  }, {
    type: "Maternity Leave",
    allocation: "90 days",
    accrual: "Available when needed",
    carryOver: "Must be used within specified period",
    eligibility: "Female employees",
    requirements: "Medical certification required",
    icon: Users,
    color: "pink"
  }, {
    type: "Parental Leave",
    allocation: "20 days",
    accrual: "Available when needed",
    carryOver: "Must be used within 12 months of birth/adoption",
    eligibility: "All parents",
    requirements: "Birth/adoption certificate required",
    icon: Users,
    color: "green"
  }, {
    type: "Family Leave",
    allocation: "3 days per year",
    accrual: "Full allocation at year start",
    carryOver: "No carryover",
    eligibility: "All permanent employees",
    requirements: "Documentation may be required",
    icon: Users,
    color: "orange"
  }, {
    type: "Adoption Leave",
    allocation: "20 days",
    accrual: "Available when needed",
    carryOver: "Must be used within adoption period",
    eligibility: "Adoptive parents",
    requirements: "Legal adoption documentation required",
    icon: Users,
    color: "purple"
  }, {
    type: "Study Leave",
    allocation: "6 days per year",
    accrual: "Full allocation at year start",
    carryOver: "No carryover",
    eligibility: "Employees with >1 year service",
    requirements: "Course approval and proof of attendance",
    icon: FileText,
    color: "indigo"
  }, {
    type: "Wellness Leave",
    allocation: "2 days per year",
    accrual: "Full allocation at year start",
    carryOver: "No carryover",
    eligibility: "All permanent employees",
    requirements: "Self-certification acceptable",
    icon: CheckCircle,
    color: "teal"
  }];
  const applicationProcess = [{
    step: 1,
    title: "Submit Request",
    description: "Use the leave management system to submit your request with all required details.",
    icon: FileText
  }, {
    step: 2,
    title: "Manager Review",
    description: "Your direct manager will review the request and may contact you for clarification.",
    icon: Users
  }, {
    step: 3,
    title: "Approval Decision",
    description: "You'll receive an email notification with the approval decision and any comments.",
    icon: CheckCircle
  }, {
    step: 4,
    title: "Calendar Update",
    description: "Approved leave will be automatically added to team calendars and payroll systems.",
    icon: Calendar
  }];
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
  return <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Leave Policy Guide</h2>
        <p className="text-gray-600">Complete information about leave types, policies, and procedures</p>
      </div>

      <Tabs defaultValue="leave-types" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leave-types">Leave Types</TabsTrigger>
          <TabsTrigger value="process">Application Process</TabsTrigger>
          <TabsTrigger value="policies">Policies & Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="leave-types" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaveTypes.map((leave, index) => {
            const IconComponent = leave.icon;
            return <Card key={index} className="hover:shadow-md transition-shadow">
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
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Accrual:</span>
                        <span className="font-medium">{leave.accrual}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Carry-over:</span>
                        <span className="font-medium">{leave.carryOver}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Eligibility:</span>
                        <span className="font-medium">{leave.eligibility}</span>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-600">
                        <strong>Requirements:</strong> {leave.requirements}
                      </p>
                    </div>
                  </CardContent>
                </Card>;
          })}
          </div>
        </TabsContent>

        <TabsContent value="process" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Application Process</CardTitle>
              <CardDescription>Follow these steps to submit and track your leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {applicationProcess.map((step, index) => {
                const IconComponent = step.icon;
                return <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                        </div>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </div>;
              })}
              </div>
            </CardContent>
          </Card>

          <Card>
            
            
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>General Policies</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <h4 className="font-medium text-gray-900">Eligibility</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• All permanent employees are entitled to leave benefits</li>
                    <li>• Employees serving notice are not eligible for annual leave</li>
                    <li>• Part-time employees receive pro-rated allocations</li>
                  </ul>
                </div>
                
                <div className="space-y-2 text-sm">
                  <h4 className="font-medium text-gray-900">Approval Authority</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Direct manager approval required for all requests</li>
                    <li>• HR approval needed for extended leave ({'>'}2 weeks)</li>
                    <li>• CEO approval for sabbaticals</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span>Important Rules</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <h4 className="font-medium text-gray-900">Restrictions</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• No more than 3 consecutive weeks annual leave</li>
                    <li>• Blackout periods apply during busy seasons</li>
                    <li>• Maximum 50% of team on leave simultaneously</li>
                  </ul>
                </div>
                
                <div className="space-y-2 text-sm">
                  <h4 className="font-medium text-gray-900">Documentation</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Medical certificates for sick leave {'>'}3 days</li>
                    <li>• Birth certificates for parental leave</li>
                    <li>• Course enrollment for study leave</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Who to contact for leave-related questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">HR Department</h4>
                  <p className="text-sm text-blue-700 mt-1">Policy questions & complex cases</p>
                  <p className="text-sm text-blue-600 mt-2">hr@company.com</p>
                  <p className="text-sm text-blue-600">ext. 1234</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900">Direct Manager</h4>
                  <p className="text-sm text-green-700 mt-1">Leave approvals & scheduling</p>
                  <p className="text-sm text-green-600 mt-2">Your manager</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900">IT Support</h4>
                  <p className="text-sm text-purple-700 mt-1">System issues & access</p>
                  <p className="text-sm text-purple-600 mt-2">support@company.com</p>
                  <p className="text-sm text-purple-600">ext. 5678</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
};