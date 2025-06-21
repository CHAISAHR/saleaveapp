
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { HolidayFormDialog } from "./HolidayFormDialog";
import { useHolidayForm } from "./hooks/useHolidayForm";

interface HolidayFormProps {
  onHolidayAdded: () => void;
  hasValidToken: () => boolean;
  getAuthHeaders: () => Record<string, string>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const HolidayForm = ({ onHolidayAdded, hasValidToken, getAuthHeaders, loading, setLoading }: HolidayFormProps) => {
  const [showHolidayForm, setShowHolidayForm] = useState(false);

  const {
    newHoliday,
    setNewHoliday,
    handleAddHoliday
  } = useHolidayForm({
    onHolidayAdded,
    hasValidToken,
    getAuthHeaders,
    loading,
    setLoading,
    onClose: () => setShowHolidayForm(false)
  });

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
      
      <HolidayFormDialog
        open={showHolidayForm}
        onOpenChange={setShowHolidayForm}
        newHoliday={newHoliday}
        setNewHoliday={setNewHoliday}
        onSubmit={handleAddHoliday}
        loading={loading}
      />
    </Dialog>
  );
};
