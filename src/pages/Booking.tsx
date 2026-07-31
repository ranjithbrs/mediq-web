import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Clock, Calendar as CalendarIcon, DollarSign } from "lucide-react";
import { useDoctorById } from "@/hooks/useDoctors";
import { useAvailableSlots } from "@/hooks/useTimeSlots";
import { toLocalDateString, isBeforeToday, getTodayLocalDateString } from "@/utils/dateUtils";


const Booking = () => {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get("doctor");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState("consultation");
  const [tokenType, setTokenType] = useState<"normal" | "priority" | "emergency" | "premium">("normal");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const { data: doctorData, isLoading: doctorLoading } = useDoctorById(doctorId || undefined);
  const { data: availableSlots = [], isLoading: slotsLoading } = useAvailableSlots(
    doctorId || undefined,
    selectedDate ? toLocalDateString(selectedDate) : undefined
  );

  const isToday = selectedDate ? toLocalDateString(selectedDate) === getTodayLocalDateString() : false;

  const isSlotDisabled = (slotTime: string, isBooked: boolean) => {
    if (isBooked) return true;
    if (!isToday) return false;
    if (!slotTime) return true;

    // Parse the slot time "HH:MM:SS" or "HH:MM"
    const [slotHours, slotMinutes] = slotTime.split(":").map(Number);
    const slotTimeInMinutes = slotHours * 60 + slotMinutes;

    // Get current local time
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    // Add 15 minutes buffer
    const cutoffTimeInMinutes = currentHours * 60 + currentMinutes + 15;

    return slotTimeInMinutes < cutoffTimeInMinutes;
  };
  

  const doctor = doctorData;
  const hospital = doctorData?.hospitals;
  const loading = doctorLoading;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleBooking = async () => {
    if (!user || !doctor || !hospital) {
      navigate("/auth");
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Incomplete Information",
        description: "Please select both date and time",
        variant: "destructive",
      });
      return;
    }

    if (isSlotDisabled(selectedTime, false)) {
      toast({
        title: "Slot Unavailable",
        description: "The selected time slot is no longer available. Please select another slot.",
        variant: "destructive",
      });
      return;
    }

    const feeMultiplier = tokenType === "emergency" ? 1.0 : tokenType === "premium" ? 0.75 : tokenType === "priority" ? 0.5 : 0;
    const priorityFee = Math.round(doctor.consultation_fee * feeMultiplier);
    
    navigate("/payment", {
      state: {
        bookingData: {
          doctorId: doctorId!,
          doctorName: doctor.name,
          doctorSpecialization: doctor.specialization,
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          appointmentDate: toLocalDateString(selectedDate),
          appointmentTime: selectedTime,
          appointmentType: appointmentType,
          tokenType: tokenType,
          specialInstructions: specialInstructions,
          consultationFee: doctor.consultation_fee,
          priorityFee: priorityFee,
        },
      },
    });
  };

  if (loading || authLoading || !user) {
    return (
      <MainLayout>
        <div className="container py-6">
          <div className="text-center">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!doctor || !hospital) {
    return (
      <MainLayout>
        <div className="container py-6">
          <div className="text-center">Doctor not found</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Book Appointment</h1>

        {/* Doctor Summary */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {doctor.photo && (
                <img
                  src={doctor.photo}
                  alt={doctor.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{doctor.name}</h3>
                <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                <p className="text-sm text-muted-foreground">{hospital.name}</p>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  <span>₹{doctor.consultation_fee}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => isBeforeToday(date)}
              className="rounded-md border w-full"
            />
          </CardContent>
        </Card>

        {/* Time Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Select Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slotsLoading ? (
              <div className="text-center py-4">Loading available slots...</div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {selectedDate ? "No slots available for selected date" : "Please select a date first"}
              </div>
            ) : (
              <div className="space-y-4">
                {/* AM Slots */}
                {availableSlots.filter(slot => {
                  const hour = parseInt(slot.slot_time.split(':')[0]);
                  return hour < 12;
                }).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Morning (AM)</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots
                        .filter(slot => {
                          const hour = parseInt(slot.slot_time.split(':')[0]);
                          return hour < 12;
                        })
                        .map((slot) => (
                          <Button
                            key={slot.slot_time}
                            variant={selectedTime === slot.slot_time ? "default" : "outline"}
                            className="w-full"
                            onClick={() => setSelectedTime(slot.slot_time)}
                            disabled={isSlotDisabled(slot.slot_time, slot.is_booked)}
                          >
                            {slot.slot_time}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}

                {/* PM Slots */}
                {availableSlots.filter(slot => {
                  const hour = parseInt(slot.slot_time.split(':')[0]);
                  return hour >= 12;
                }).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Afternoon/Evening (PM)</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots
                        .filter(slot => {
                          const hour = parseInt(slot.slot_time.split(':')[0]);
                          return hour >= 12;
                        })
                        .map((slot) => (
                          <Button
                            key={slot.slot_time}
                            variant={selectedTime === slot.slot_time ? "default" : "outline"}
                            className="w-full"
                            onClick={() => setSelectedTime(slot.slot_time)}
                            disabled={isSlotDisabled(slot.slot_time, slot.is_booked)}
                          >
                            {slot.slot_time}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token Type */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Token Type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup name="token-type" value={tokenType} onValueChange={(v) => setTokenType(v as typeof tokenType)}>
              {/* Normal */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${tokenType === 'normal' ? 'border-primary bg-primary/5' : ''}`}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal" className="cursor-pointer">
                    <span className="font-medium">Normal Token</span>
                    <p className="text-xs text-muted-foreground">Standard queue position</p>
                  </Label>
                </div>
                <span className="font-semibold">₹{doctor.consultation_fee}</span>
              </div>

              {/* Priority */}
              <div className={`flex items-center justify-between p-3 rounded-lg border mt-2 ${tokenType === 'priority' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/10'}`}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="priority" id="priority" />
                  <Label htmlFor="priority" className="cursor-pointer">
                    <span className="font-medium text-amber-700 dark:text-amber-400">⚡ Priority Token</span>
                    <p className="text-xs text-muted-foreground">Skip ahead in queue (+50%)</p>
                  </Label>
                </div>
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  ₹{doctor.consultation_fee + Math.round(doctor.consultation_fee * 0.5)}
                </span>
              </div>

              {/* Premium */}
              <div className={`flex items-center justify-between p-3 rounded-lg border mt-2 ${tokenType === 'premium' ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' : 'border-purple-200 bg-purple-50/50 dark:bg-purple-950/10'}`}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="premium" id="premium" />
                  <Label htmlFor="premium" className="cursor-pointer">
                    <span className="font-medium text-purple-700 dark:text-purple-400">👑 Premium Token</span>
                    <p className="text-xs text-muted-foreground">VIP priority access (+75%)</p>
                  </Label>
                </div>
                <span className="font-semibold text-purple-700 dark:text-purple-400">
                  ₹{doctor.consultation_fee + Math.round(doctor.consultation_fee * 0.75)}
                </span>
              </div>

              {/* Emergency */}
              <div className={`flex items-center justify-between p-3 rounded-lg border mt-2 ${tokenType === 'emergency' ? 'border-destructive bg-destructive/10' : 'border-destructive/30 bg-destructive/5'}`}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="emergency" id="emergency" />
                  <Label htmlFor="emergency" className="cursor-pointer">
                    <span className="font-medium text-destructive">🚨 Emergency Token</span>
                    <p className="text-xs text-muted-foreground">Highest priority — urgent care (+100%)</p>
                  </Label>
                </div>
                <span className="font-semibold text-destructive">
                  ₹{doctor.consultation_fee + Math.round(doctor.consultation_fee * 1.0)}
                </span>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Appointment Type */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Appointment Type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup name="appointment-type" value={appointmentType} onValueChange={(v) => {
              setAppointmentType(v);
              if (v === "emergency" && tokenType === "normal") {
                setTokenType("emergency");
              }
            }}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="consultation" id="consultation" />
                <Label htmlFor="consultation">New Consultation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="follow-up" id="follow-up" />
                <Label htmlFor="follow-up">Follow-up</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="emergency" id="emergency-type" />
                <Label htmlFor="emergency-type">Emergency</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Special Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Special Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any special requirements or symptoms you'd like to mention..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleBooking}
            disabled={!selectedDate || !selectedTime}
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Booking;