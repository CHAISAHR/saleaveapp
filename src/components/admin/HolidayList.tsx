
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Holiday {
  id: number;
  name: string;
  date: string;
  type: string;
  description: string;
  office_status: string;
}

interface HolidayListProps {
  holidays: Holiday[];
  loading: boolean;
}

export const HolidayList = ({ holidays, loading }: HolidayListProps) => {
  const { toast } = useToast();

  const handleDeleteHoliday = (holidayId: number, holidayName: string) => {
    // For now, just show a message that this feature is not implemented
    toast({
      title: "Feature Not Available",
      description: "Holiday deletion will be implemented in a future update.",
      variant: "destructive",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Existing Holidays</CardTitle>
        <CardDescription>Manage current holiday entries</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading holidays...</div>
        ) : (
          <div className="space-y-4">
            {holidays.map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{holiday.name}</h4>
                  <p className="text-sm text-gray-600">{holiday.description}</p>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span>{new Date(holiday.date).toLocaleDateString()}</span>
                    <Badge variant={holiday.type === 'public' ? 'default' : 'secondary'}>
                      {holiday.type === 'public' ? 'Public' : 'Company'}
                    </Badge>
                    <span className={holiday.office_status === 'closed' ? 'text-red-600' : 'text-blue-600'}>
                      {holiday.office_status === 'closed' ? 'Office Closed' : 'Optional'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteHoliday(holiday.id, holiday.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
