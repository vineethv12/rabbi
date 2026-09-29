import { useEffect, useCallback } from "react";
import { X, ArrowRight, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEnrollModal } from "@/contexts/EnrollModalContext";
import { useContactForm } from "@/hooks/useContactForm";

export function EnrollModal() {
  const { isOpen, preProgram, closeEnrollModal } = useEnrollModal();
  const { form, set, setSelect, status, setStatus, errorMsg, reset, handleSubmit } =
    useContactForm();

  const handleClose = useCallback(() => {
    closeEnrollModal();
    setTimeout(reset, 300);
  }, [closeEnrollModal, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose]);

  // Pre-fill the program field whenever the modal opens with a pre-selected program
  useEffect(() => {
    if (isOpen && preProgram) {
      setSelect("program")(preProgram);
    }
  }, [isOpen, preProgram]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-primary px-8 py-6 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-secondary text-xs font-semibold mb-2">
                ✦ Enroll Now
              </div>
              <h2 className="text-2xl font-serif font-bold text-white">Start Your Journey</h2>
              {preProgram ? (
                <p className="text-white/90 text-sm mt-0.5 font-medium">{preProgram}</p>
              ) : (
                <p className="text-white/70 text-sm mt-0.5">We'll reach out within 24 hours.</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-white/60 hover:text-white transition-colors mt-1 flex-shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-8 py-6">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-9 w-9 text-green-500" />
              </div>
              <h3 className="text-xl font-serif font-bold text-primary">Thank You!</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Your enquiry has been received. Our team will contact you within 24 hours.
              </p>
              <Button
                onClick={handleClose}
                className="mt-2 bg-primary hover:bg-primary/90 text-white rounded-full px-8"
              >
                Done
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="m-name" className="font-semibold text-primary/80 text-sm">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="m-name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={set("name")}
                    className="rounded-xl h-11 bg-background/60 border-border/60 focus-visible:ring-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-email" className="font-semibold text-primary/80 text-sm">
                    Email Address
                  </Label>
                  <Input
                    id="m-email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={set("email")}
                    className="rounded-xl h-11 bg-background/60 border-border/60 focus-visible:ring-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="m-phone" className="font-semibold text-primary/80 text-sm">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="m-phone"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={set("phone")}
                    className="rounded-xl h-11 bg-background/60 border-border/60 focus-visible:ring-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-city" className="font-semibold text-primary/80 text-sm">
                    City
                  </Label>
                  <Input
                    id="m-city"
                    placeholder="Bengaluru"
                    value={form.city}
                    onChange={set("city")}
                    className="rounded-xl h-11 bg-background/60 border-border/60 focus-visible:ring-secondary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-primary/80 text-sm">Interested In</Label>
                {preProgram ? (
                  <div className="h-11 px-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center text-sm font-semibold text-primary">
                    {preProgram}
                  </div>
                ) : (
                  <Select value={form.program} onValueChange={setSelect("program")}>
                    <SelectTrigger className="rounded-xl h-11 bg-background/60 border-border/60">
                      <SelectValue placeholder="Select a program or inquiry type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="abacus">Abacus Program</SelectItem>
                      <SelectItem value="vedic">Vedic Mathematics</SelectItem>
                      <SelectItem value="brain">Brain Development</SelectItem>
                      <SelectItem value="franchise">Franchise Opportunity</SelectItem>
                      <SelectItem value="teacher">Teacher Training</SelectItem>
                      <SelectItem value="other">Other Inquiry</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-message" className="font-semibold text-primary/80 text-sm">
                  Your Message
                </Label>
                <Textarea
                  id="m-message"
                  placeholder="Tell us more about what you're looking for..."
                  value={form.message}
                  onChange={set("message")}
                  className="min-h-[100px] rounded-xl bg-background/60 border-border/60 focus-visible:ring-secondary resize-none"
                />
              </div>

              {status === "error" && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base rounded-xl font-semibold shadow-lg shadow-primary/20 disabled:opacity-70"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    Send Enquiry <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
