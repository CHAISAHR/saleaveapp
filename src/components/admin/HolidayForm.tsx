
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from '@/config/apiConfig';

interface HolidayFormProps {
  onHolidayAdded: () => void;
  hasValidToken: () => boolean;
  getAuthHeaders: () => Record<string, string>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const HolidayForm = ({ onHolidayAdded, hasValidToken, getAuthHeaders, loading, setLoading }: HolidayFormProps) => {
  const { toast } = useToast();
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: undefined as Date | undefined,
    type: "public",
    description: "",
    office_status: "closed"
  });

  const handleAddHoliday = async () => {
    console.log('Starting holiday creation process...');
    console.log('Holiday data:', newHoliday);

    if (!newHoliday.name || !newHoliday.date) {
      console.log('Validation failed: Missing name or date');
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!hasValidToken()) {
      console.log('Authentication failed: No valid token');
      toast({
        title: "Authentication Required",
        description: "Please log in to add holidays.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        name: newHoliday.name,
        date: format(newHoliday.date, 'yyyy-MM-dd'),
        type: newHoliday.type,
        description: newHoliday.description,
        office_status: newHoliday.office_status,
        is_recurring: false
      };

      console.log('Sending request to:', apiConfig.endpoints.holiday);
      console.log('Request data:', requestData);
      console.log('Headers:', getAuthHeaders());

      const response = await fetch(apiConfig.endpoints.holiday, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        console.log('Holiday created successfully');
        onHolidayAdded();
        
        // Reset form
        setNewHoliday({
          name: "",
          date: undefined,
          type: "public",
          description: "",
          office_status: "closed"
        });
        setShowHolidayForm(false);

        toast({
          title: "Holiday Added",
          description: `${newHoliday.name} has been added to the holiday calendar.`,
        });
      } else {
        console.error('Server returned error:', response.status, responseData);
        throw new Error(responseData.message || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof Error && error.message === 'Failed to fetch') {
        toast({
          title: "Backend Connection Error",
          description: "Cannot connect to the backend server. Please check your connection and ensure the server is running.",
          variant: "destructive",
        });
      } else if (error instanceof Error && error.message === 'No valid authentication token') {
        toast({
          title: "Authentication Required",
          description: "Please log in to add holidays.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error Adding Holiday",
          description: error instanceof Error ? error.message : "Failed to add holiday. Check console for details.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={showHolidayForm} onOpenChange={setShowHolidayForm}>
      <DialogTrigger asChild>
        <Button 
          className="bg-blue-600 hover:bg-blue-700" 
          disabled={loading || !hasValidToken()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Holiday
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Holiday</DialogTitle>
          <DialogDescription>
            Create a new company holiday or public holiday entry.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Holiday Name *</Label>
            <Input
              id="name"
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
              <Label htmlFor="type">Holiday Type</Label>
              <Select value={newHoliday.type} onValueChange={(value) => setNewHoliday(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public Holiday</SelectItem>
                  <SelectItem value="company">Company Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Office Status</Label>
              <Select value={newHoliday.office_status} onValueChange={(value) => setNewHoliday(prev => ({ ...prev, office_status: value }))}>
                <SelectTrigger>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the holiday"
              value={newHoliday.description}
              onChange={(e) => setNewHoliday(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowHolidayForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHoliday} disabled={loading}>
              {loading ? "Adding..." : "Add Holiday"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
