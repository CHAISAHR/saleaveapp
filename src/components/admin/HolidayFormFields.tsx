
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface HolidayFormData {
  name: string;
  date: Date | undefined;
  type: string;
  description: string;
  office_status: string;
}

interface HolidayFormFieldsProps {
  newHoliday: HolidayFormData;
  setNewHoliday: React.Dispatch<React.SetStateAction<HolidayFormData>>;
}

export const HolidayFormFields = ({ newHoliday, setNewHoliday }: HolidayFormFieldsProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="holiday-name">Holiday Name *</Label>
        <Input
          id="holiday-name"
          name="holiday-name"
          placeholder="e.g., New Year's Day"
          value={newHoliday.name}
          onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {newHoliday.date ? format(newHoliday.date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={newHoliday.date}
              onSelect={(date) => setNewHoliday(prev => ({ ...prev, date }))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="holiday-type">Holiday Type</Label>
          <Select value={newHoliday.type} onValueChange={(value) => setNewHoliday(prev => ({ ...prev, type: value }))}>
            <SelectTrigger id="holiday-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public Holiday</SelectItem>
              <SelectItem value="company">Company Holiday</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="office-status">Office Status</Label>
          <Select value={newHoliday.office_status} onValueChange={(value) => setNewHoliday(prev => ({ ...prev, office_status: value }))}>
            <SelectTrigger id="office-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="closed">Office Closed</SelectItem>
              <SelectItem value="optional">Optional Attendance</SelectItem>
              <SelectItem value="open">Office Open</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="holiday-description">Description</Label>
        <Textarea
          id="holiday-description"
          name="holiday-description"
          placeholder="Brief description of the holiday"
          value={newHoliday.description}
          onChange={(e) => setNewHoliday(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
    </div>
  );
};
