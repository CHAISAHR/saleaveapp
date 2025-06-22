
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Heart, 
  Baby, 
  Scale, 
  Home, 
  UserPlus, 
  BookOpen, 
  Brain 
} from "lucide-react";

// Map icon names to actual Lucide components
const iconMap = {
  'vacation': Calendar,
  'sick-leave': Heart,
  'floating-holiday': Baby,
  'jury-duty': Scale,
  'bereavement': Home,
  'adoption': UserPlus,
  'study': BookOpen,
  'mental': Brain
};

const leaveTypes = [
  {
    type: "Annual leave",
    icon: 'vacation',
    description: "7.1 Annual leave - The employee shall be entitled to 20 (twenty) working days' paid leave in respect of each annual leave cycle (January 1st – December 31st of each year) which shall accrue at 1.66 days per month. The employee is not entitled to take leave for which such leave has not been accrued, unless approved by the employer in writing. Accrued annual leave, can only be carried over to the next annual leave cycle for a maximum period of 6 (six) months after which the staff will forfeit it and no payment shall be made. The employee shall not be entitled to take annual leave during any period of notice, after any notice of termination is given by either party in terms of the termination provisions contained this contract."
  },
  {
    type: "Sick leave",
    icon: 'sick-leave',
    description: "7.2 Sick Leave - 7.2.1 The employee shall be entitled to the amount of sick leave provided for in terms of the Basic Conditions of Employment Act 75 of 1997 (\"BCEA\"). During the first six (6) months of employment, an employee is entitled to one (1) day's paid sick leave for every twenty-six (26) days worked. 7.2.2 If the employee is absent from work due to illness for 2 (two) consecutive days or more or on 2 (two) occasions within an 8 (eight) week period, the employee is obliged to supply the employer with a medical certificate issued by a medical practitioner setting out the reasons for their absence from work. 7.2.3 It is the employee's duty to notify both the relevant CHAI manager and provincial manager, of their absence."
  },
  {
    type: "Maternity leave",
    icon: 'floating-holiday',
    description: "7.3 Maternity Leave - Female employees shall, as per the BCEA, be entitled to four (4) consecutive months' maternity leave. A female employee is entitled to three months' paid maternity leave under CHAI's benefit provision. An additional one (1) month of maternity leave will be provided under the provisions of UIF."
  },
  {
    type: "Parental leave",
    icon: 'jury-duty',
    description: "7.4 Parental Leave - An employee is entitled to 4 (four) weeks per calendar year of unpaid parental leave in the circumstances provided for in the BCEA, as amended. An employee may commence parental leave on— (a) the day that the employee's child is born; or (b) the date— (i) that the adoption order is granted; or (ii) that a child is placed in the care of a prospective adoptive parent by a competent court, pending the finalisation of an adoption order in respect of that child, whichever date occurs first. An employee must notify the employer in writing, unless the employee is unable to do so, of the date on which the employee intends to commence parental leave and return to work after parental leave. Notification to the employer must be given at least 1 (one) month before the employee's child is expected to be born or, if it is not reasonably practicable to do so, as soon as is reasonably practicable."
  },
  {
    type: "Family leave",
    icon: 'bereavement',
    description: "7.5 Family Responsibility Leave - The employee shall, as per the BCEA, be entitled to three (3) days of Family Responsibility Leave per calendar year."
  },
  {
    type: "Adoption leave",
    icon: 'adoption',
    description: "7.6 Adoption and Commissioning Parental Leave - Employees are entitled to 10 (ten) consecutive weeks of leave, or the parental leave referred to above, if: (a) the employee is a commissioning parent in a surrogate motherhood agreement; or (b) the employee is an adoptive parent of a child who is below the age of 2 (two) years. Any leave taken in terms of this provision shall be in compliance with the BCEA, as amended"
  },
  {
    type: "Study leave",
    icon: 'study',
    description: "The employee shall be entitled to six (6) days of Study leave per calendar year."
  },
  {
    type: "Wellness Days",
    icon: 'mental',
    description: "The employee shall be entitled to two (2) Wellness days leave per calendar year."
  }
];

export const About = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">About Leave Types</h2>
        <p className="text-gray-600">Information about different types of leave available to employees</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {leaveTypes.map((leave, index) => {
          const IconComponent = iconMap[leave.icon as keyof typeof iconMap];
          
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{leave.type}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {leave.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
          <CardDescription>General information about leave policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Basic Conditions of Employment Act (BCEA)</h4>
            <p className="text-sm text-gray-700">
              Most leave entitlements are governed by the Basic Conditions of Employment Act 75 of 1997. 
              This ensures compliance with South African labor law.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Documentation Requirements</h4>
            <p className="text-sm text-gray-700">
              Certain types of leave may require supporting documentation such as medical certificates, 
              birth certificates, or other relevant proof as specified in each leave type description.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Notification Requirements</h4>
            <p className="text-sm text-gray-700">
              Employees are required to provide appropriate notice for leave requests where specified. 
              Emergency situations may have different notification requirements.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
