
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HolidayFormFields } from "./HolidayFormFields";

interface HolidayFormData {
  name: string;
  date: Date | undefined;
  type: string;
  description: string;
  office_status: string;
}

interface HolidayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newHoliday: HolidayFormData;
  setNewHoliday: React.Dispatch<React.SetStateAction<HolidayFormData>>;
  onSubmit: () => void;
  loading: boolean;
}

export const HolidayFormDialog = ({ 
  open, 
  onOpenChange, 
  newHoliday, 
  setNewHoliday, 
  onSubmit, 
  loading 
}: HolidayFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Holiday</DialogTitle>
          <DialogDescription>
            Create a new company holiday or public holiday entry.
          </DialogDescription>
        </DialogHeader>
        
        <HolidayFormFields 
          newHoliday={newHoliday} 
          setNewHoliday={setNewHoliday} 
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Holiday"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
