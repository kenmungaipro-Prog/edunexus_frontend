// ============================================================
// app/pages/students/new.tsx
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Link, useNavigation, redirect, Form } from "react-router";
import type { Route } from "./+types/new";
import { api, type AcademicSession, type AdmissionNumberCheckResult, type ClassRoom, type CreateClassPayload, type CreateStudentPayload, type Driver, type FeeCategory, type FeeStructure, type FeeStructurePayload, type ParentProfile, type Subject, type Teacher, type TransportRoute, type Vehicle } from "~/lib/api";
import { validateClassRoom, validateStudent } from "~/lib/validation";

export async function clientLoader() {
  const [classesRes, teachersRes, subjectsRes] = await Promise.all([
    api.classes.list({ per_page: 100 }),
    api.teachers.list({ per_page: 200 }),
    api.subjects.list(),
  ]);
  const teachers = ((teachersRes as any).data?.data ?? (teachersRes as any).data ?? []) as Teacher[];
  const subjects = ((subjectsRes as any).data?.data ?? (subjectsRes as any).data ?? []) as Subject[];
  return { classes: classesRes.data as ClassRoom[], teachers, subjects };
}

export async function clientAction({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");
  const raw = Object.fromEntries(form.entries()) as Record<string, string>;
  const payload: Partial<CreateStudentPayload> = {};

  for (const [k, v] of Object.entries(raw)) {
    if (k === "intent") continue;
    if (v === "" || v === undefined) continue;
    (payload as Record<string, unknown>)[k] = v;
  }

  if (payload.class_id)   payload.class_id   = Number(payload.class_id)   as unknown as typeof payload.class_id;
  if (payload.parent_id)  payload.parent_id  = Number(payload.parent_id)  as unknown as typeof payload.parent_id;
  if (payload.secondary_parent_id) payload.secondary_parent_id = Number(payload.secondary_parent_id) as unknown as typeof payload.secondary_parent_id;
  if (raw.existing_student === "1") {
    payload.existing_student = true;
  } else {
    delete payload.existing_student;
    delete payload.admission_no;
  }

  // Frontend validation
  const validationErrors = validateStudent(payload);
  if (Object.keys(validationErrors).length > 0) {
    return {
      error: "Please fix the highlighted errors below.",
      errors: Object.fromEntries(
        Object.entries(validationErrors).map(([field, message]) => [field, [message]])
      ),
    };
  }

  try {
    const res = await api.students.create(payload as CreateStudentPayload);
    if (intent === "create_student") {
      return { createdStudentId: res.data.id };
    }
    const { redirect } = await import("react-router");
    return redirect(`/students/${res.data.id}`);
  } catch (e: unknown) {
    const err = e as { message?: string; errors?: Record<string, string[]> };
    return {
      error:  err?.message ?? "Failed to create student.",
      errors: err?.errors  ?? {},
    };
  }
}

const s = {
  page: { fontFamily: "'Sora', sans-serif", color: "#e2e8f0", maxWidth: "780px", margin: "0 auto", boxSizing: "border-box" } as React.CSSProperties,
  breadcrumb: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "13px", flexWrap: "wrap" as const } as React.CSSProperties,
  heading: { fontSize: "22px", fontWeight: 700, marginBottom: "6px", letterSpacing: "-0.3px" } as React.CSSProperties,
  subheading: { fontSize: "13px", color: "#6b7a99", marginBottom: "28px" } as React.CSSProperties,
  card: { background: "#0f1424", border: "1px solid #1e2640", borderRadius: "14px", padding: "28px", marginBottom: "16px", boxSizing: "border-box" } as React.CSSProperties,
  sectionTitle: { fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#4f8ef7", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } as React.CSSProperties,
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" } as React.CSSProperties,
  label: { display: "block", fontSize: "11px", fontWeight: 600, color: "#6b7a99", marginBottom: "6px", letterSpacing: "0.05em" } as React.CSSProperties,
  input: { width: "100%", boxSizing: "border-box" as const, background: "#0a0e1a", border: "1px solid #2a3350", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", color: "#e2e8f0", outline: "none", transition: "border-color .15s", fontFamily: "'Sora', sans-serif" } as React.CSSProperties,
  inputError: { borderColor: "#ef4444" } as React.CSSProperties,
  fieldError: { fontSize: "11px", color: "#f87171", marginTop: "4px" } as React.CSSProperties,
  select: {
    width: "100%", boxSizing: "border-box" as const,
    background: "#0a0e1a", border: "1px solid #2a3350",
    borderRadius: "8px", padding: "9px 12px",
    fontSize: "13px", color: "#e2e8f0",
    outline: "none", transition: "border-color .15s",
    fontFamily: "'Sora', sans-serif", appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7a99' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "32px",
  } as React.CSSProperties,
  textarea: { width: "100%", boxSizing: "border-box" as const, background: "#0a0e1a", border: "1px solid #2a3350", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", color: "#e2e8f0", outline: "none", transition: "border-color .15s", fontFamily: "'Sora', sans-serif", resize: "none" as const, lineHeight: 1.6 } as React.CSSProperties,
  errorBanner: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#f87171", fontWeight: 600, display: "flex", alignItems: "flex-start", gap: "8px" } as React.CSSProperties,
  actions: { display: "flex", gap: "10px", paddingTop: "4px" } as React.CSSProperties,
  btnCancel: { flex: 1, padding: "11px 20px", background: "#1e2640", border: "1px solid #2a3350", borderRadius: "9px", color: "#a0aec0", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'Sora', sans-serif", transition: "all .15s", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" } as React.CSSProperties,
  btnSubmit: { flex: 2, padding: "11px 24px", background: "linear-gradient(135deg, #4f8ef7, #6366f1)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Sora', sans-serif", transition: "opacity .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" } as React.CSSProperties,
} as const;

function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "#4f8ef7";
}
function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "#2a3350";
}

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={s.label}>
        {label}
        {required && <span style={{ color: "#f87171", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && !error && <p style={{ fontSize: "11px", color: "#4b5a7a", marginTop: "4px" }}>{hint}</p>}
      {error && <p style={s.fieldError}>{error}</p>}
    </div>
  );
}

function SectionIcon({ emoji }: { emoji: string }) {
  return (
    <span style={{ width: "20px", height: "20px", borderRadius: "5px", background: "rgba(79,142,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", flexShrink: 0 }}>
      {emoji}
    </span>
  );
}

const STEPS = [
  { label: "Personal Info", icon: "👤", desc: "Student details" },
  { label: "Academics", icon: "🎓", desc: "Class placement" },
  { label: "Parent / Guardian", icon: "👨‍👩‍👧", desc: "Family contact details" },
  { label: "Fees", icon: "🧾", desc: "Create a student invoice" },
  { label: "Transport", icon: "🚌", desc: "Assign a route" },
];

const EMPTY_ACTION_ERRORS: Record<string, string[]> = {};

function currentDateInputValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

type AdmissionCheckState =
  | { status: "idle" | "checking" | "available" }
  | { status: "duplicate"; result: AdmissionNumberCheckResult }
  | { status: "error"; message: string };

export default function NewStudentPage({ loaderData, actionData }: Route.ComponentProps) {
  const { classes, teachers, subjects } = loaderData as { classes: ClassRoom[]; teachers: Teacher[]; subjects: Subject[] };
  const [availableClasses, setAvailableClasses] = useState<ClassRoom[]>(classes);
  const errors      = (actionData as { errors?: Record<string, string[]> })?.errors ?? EMPTY_ACTION_ERRORS;
  const globalError = (actionData as { error?: string })?.error;
  const createdStudentId = (actionData as { createdStudentId?: number } | undefined)?.createdStudentId;
  const navigation  = useNavigation();
  const submitting  = navigation.state === "submitting";
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [studentId, setStudentId] = useState<number | null>(null);
  const [studentCreatedNotice, setStudentCreatedNotice] = useState(false);
  const [confirmStudentDelete, setConfirmStudentDelete] = useState(false);
  const [admissionDate, setAdmissionDate] = useState(currentDateInputValue);
  const [existingStudentConfirmed, setExistingStudentConfirmed] = useState(false);
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [admissionCheck, setAdmissionCheck] = useState<AdmissionCheckState>({ status: "idle" });
  const [admissionCheckRetry, setAdmissionCheckRetry] = useState(0);
  const admissionDateIsPast = Boolean(admissionDate && admissionDate < currentDateInputValue());

  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loadingFeeStructures, setLoadingFeeStructures] = useState(false);
  const [feeStructureError, setFeeStructureError] = useState<string | null>(null);
  const [invoiceFeeStructureId, setInvoiceFeeStructureId] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [showCreateFeeStructure, setShowCreateFeeStructure] = useState(false);
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([]);
  const [loadingFeeStructureForm, setLoadingFeeStructureForm] = useState(false);
  const [savingFeeStructure, setSavingFeeStructure] = useState(false);
  const [createFeeStructureError, setCreateFeeStructureError] = useState<string | null>(null);
  const [feeStructureFields, setFeeStructureFields] = useState({
    name: "",
    billing_period: "term",
    items: [{ fee_category_id: "", description: "", amount: "" }],
  });

  const [showTransportDialog, setShowTransportDialog] = useState(false);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingTransportData, setLoadingTransportData] = useState(false);
  const [transportDataError, setTransportDataError] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedRouteStop, setSelectedRouteStop] = useState("");
  const [savingRouteAssignment, setSavingRouteAssignment] = useState(false);
  const [routeAssignmentError, setRouteAssignmentError] = useState<string | null>(null);
  const [routeAssignmentComplete, setRouteAssignmentComplete] = useState(false);
  const [showRouteEditor, setShowRouteEditor] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
  const [savingRoute, setSavingRoute] = useState(false);
  const [routeEditorError, setRouteEditorError] = useState<string | null>(null);
  const [routeFields, setRouteFields] = useState({
    name: "",
    vehicle_id: "",
    driver_id: "",
    monthly_fee: "",
    stops: [{ name: "", pickup_time: "", drop_time: "" }],
  });

  useEffect(() => {
    const admissionNo = admissionNumber.trim();
    if (!existingStudentConfirmed || !admissionNo) {
      setAdmissionCheck({ status: "idle" });
      return;
    }

    let cancelled = false;
    setAdmissionCheck({ status: "checking" });
    const timeout = window.setTimeout(() => {
      void api.students.checkAdmissionNumber(admissionNo)
        .then((response) => {
          if (cancelled) return;
          setAdmissionCheck(response.data.exists
            ? { status: "duplicate", result: response.data }
            : { status: "available" });
        })
        .catch((error: unknown) => {
          console.error("Could not check student admission number:", error);
          if (!cancelled) {
            setAdmissionCheck({
              status: "error",
              message: "Admission number could not be checked. Retry before continuing.",
            });
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [admissionNumber, admissionCheckRetry, existingStudentConfirmed]);

  useEffect(() => {
    if (existingStudentConfirmed && admissionNumber.trim() && errors.admission_no?.length) {
      setAdmissionCheckRetry((value) => value + 1);
    }
  }, [admissionNumber, errors.admission_no, existingStudentConfirmed]);

  useEffect(() => {
    if (createdStudentId) {
      setStudentId(createdStudentId);
      setStudentCreatedNotice(true);
      setStep((current) => current < 3 ? 3 : current);
    }

  }, [createdStudentId]);

  useEffect(() => {
    if (createdStudentId) return;
    const errorFields = Object.keys(errors);
    if (errorFields.some((field) => ["first_name", "last_name", "date_of_birth", "gender", "blood_group", "religion", "category", "admission_date", "admission_no", "address"].includes(field))) {
      setStep(0);
    } else if (errorFields.includes("class_id")) {
      setStep(1);
    } else if (errorFields.some((field) => ["parent_id", "parent_name", "parent_email", "parent_phone", "secondary_parent_id"].includes(field))) {
      setStep(2);
    }
  }, [createdStudentId, errors]);

  function validateStep(currentStep: number, form: HTMLFormElement): boolean {
    const values = Object.fromEntries(new FormData(form).entries());
    const validationErrors = validateStudent(values);
    const fieldsByStep = [
      ["first_name", "last_name", "date_of_birth", "gender", "blood_group", "admission_date", "admission_no", "address"],
      ["class_id"],
      ["parent_id", "parent_name", "parent_email", "parent_phone"],
    ];
    const errorsForStep = Object.fromEntries(
      fieldsByStep[currentStep]
        .filter((field) => validationErrors[field])
        .map((field) => [field, validationErrors[field]])
    );
    if (
      existingStudentConfirmed &&
      admissionNumber.trim() &&
      (currentStep === 0 || currentStep === 2) &&
      admissionCheck.status !== "available"
    ) {
      errorsForStep.admission_no = admissionCheck.status === "duplicate"
        ? "This admission number is already in use. Review the matching record below."
        : admissionCheck.status === "checking"
          ? "Wait for the admission number check to finish."
          : admissionCheck.status === "error"
            ? "Retry the admission number check before continuing."
            : "Enter an admission number and wait for its availability check.";
    }

    setStepErrors(errorsForStep);
    if (errorsForStep.admission_no && currentStep !== 0) setStep(0);
    return Object.keys(errorsForStep).length === 0;
  }

  function next(form: HTMLFormElement | null) {
    if (!form || !validateStep(step, form)) return;
    setStep((current) => current + 1);
  }

  function openTransportDialog() {
    setShowTransportDialog(true);
    setTransportDataError(null);
    setRouteAssignmentError(null);
    if (routes.length > 0 && vehicles.length > 0 && drivers.length > 0) return;

    setLoadingTransportData(true);
    Promise.all([api.transport.list(), api.transport.vehicles(), api.transport.drivers()])
      .then(([routesResponse, vehiclesResponse, driversResponse]) => {
        setRoutes(routesResponse.data ?? []);
        setVehicles(vehiclesResponse.data ?? []);
        setDrivers(driversResponse.data ?? []);
      })
      .catch((error: unknown) => {
        setTransportDataError(
          (error as { message?: string })?.message ?? "Could not load transport routes and resources."
        );
      })
      .finally(() => setLoadingTransportData(false));
  }

  function openRouteEditor(route?: TransportRoute) {
    setEditingRouteId(route?.id ?? null);
    setRouteEditorError(null);
    setRouteFields({
      name: route?.name ?? "",
      vehicle_id: route?.vehicle_id ? String(route.vehicle_id) : "",
      driver_id: route?.driver_id ? String(route.driver_id) : "",
      monthly_fee: route?.monthly_fee != null ? String(route.monthly_fee) : "",
      stops: route?.stops?.length
        ? route.stops.map((stop) => ({ ...stop }))
        : [{ name: "", pickup_time: "", drop_time: "" }],
    });
    setShowRouteEditor(true);
  }

  async function saveRoute() {
    const stops = routeFields.stops.map((stop) => ({
      name: stop.name.trim(),
      pickup_time: stop.pickup_time,
      drop_time: stop.drop_time,
    }));
    if (
      !routeFields.name.trim() ||
      !routeFields.vehicle_id ||
      !routeFields.driver_id ||
      !routeFields.monthly_fee ||
      stops.some((stop) => !stop.name || !stop.pickup_time || !stop.drop_time)
    ) {
      setRouteEditorError("Complete the route name, vehicle, driver, monthly fee, and every stop.");
      return;
    }

    const payload = {
      name: routeFields.name.trim(),
      vehicle_id: Number(routeFields.vehicle_id),
      driver_id: Number(routeFields.driver_id),
      monthly_fee: Number(routeFields.monthly_fee),
      stops,
    };
    if (!Number.isFinite(payload.monthly_fee) || payload.monthly_fee < 0) {
      setRouteEditorError("Enter a valid non-negative monthly fee.");
      return;
    }

    setSavingRoute(true);
    setRouteEditorError(null);
    try {
      const response = editingRouteId
        ? await api.transport.update(editingRouteId, payload)
        : await api.transport.create(payload);
      const savedRoute = response.data;
      setRoutes((current) => [
        ...current.filter((route) => route.id !== savedRoute.id),
        savedRoute,
      ]);
      setSelectedRouteId(String(savedRoute.id));
      setSelectedRouteStop(savedRoute.stops?.[0]?.name ?? "");
      setShowRouteEditor(false);
    } catch (error: unknown) {
      setRouteEditorError((error as { message?: string })?.message ?? "Could not save this route.");
    } finally {
      setSavingRoute(false);
    }
  }

  async function assignStudentToRoute() {
    if (!studentId || !selectedRouteId || !selectedRouteStop) {
      setRouteAssignmentError("Select a route and pickup/drop-off stop first.");
      return;
    }

    setSavingRouteAssignment(true);
    setRouteAssignmentError(null);
    try {
      await api.transport.assignStudent(Number(selectedRouteId), {
        student_id: studentId,
        stop: selectedRouteStop,
      });
      setRouteAssignmentComplete(true);
      setShowTransportDialog(false);
    } catch (error: unknown) {
      setRouteAssignmentError(
        (error as { message?: string })?.message ?? "Could not assign this student to the route."
      );
    } finally {
      setSavingRouteAssignment(false);
    }
  }

  async function openInvoiceDialog() {
    setShowInvoiceDialog(true);
    setInvoiceError(null);
    setFeeStructureError(null);
    if (feeStructures.length > 0) return;

    setLoadingFeeStructures(true);
    try {
      const response = await api.finance.feeStructures({ status: "active", per_page: 100 });
      const available = response.data.data.filter(
        (feeStructure) => feeStructure.status === "active" &&
          (feeStructure.class_id === null || feeStructure.class_id === Number(selectedClassId))
      );
      setFeeStructures(available);
      setInvoiceFeeStructureId(available[0] ? String(available[0].id) : "");
    } catch (error: unknown) {
      setFeeStructureError(
        (error as { message?: string })?.message ?? "Could not load active fee structures."
      );
    } finally {
      setLoadingFeeStructures(false);
    }
  }

  async function openCreateFeeStructureDialog() {
    setShowCreateFeeStructure(true);
    setCreateFeeStructureError(null);
    if (feeCategories.length > 0 && academicSessions.length > 0) return;

    setLoadingFeeStructureForm(true);
    try {
      const [categoriesResponse, sessionsResponse] = await Promise.all([
        api.finance.feeCategories({ active: true, per_page: 200 }),
        api.academicSessions.list(),
      ]);
      setFeeCategories(categoriesResponse.data.data);
      setAcademicSessions(sessionsResponse.data);
    } catch (error: unknown) {
      setCreateFeeStructureError(
        (error as { message?: string })?.message ?? "Could not load fee categories and academic sessions."
      );
    } finally {
      setLoadingFeeStructureForm(false);
    }
  }

  async function createFeeStructure() {
    const selectedClass = availableClasses.find((classRoom) => classRoom.id === Number(selectedClassId));
    const sessionId = selectedClass?.session_id;
    const items = feeStructureFields.items.map((item) => ({
      fee_category_id: Number(item.fee_category_id),
      description: item.description.trim() || null,
      amount: Number(item.amount),
      is_mandatory: true,
      is_recurring: true,
    }));

    if (!sessionId || !academicSessions.some((session) => session.id === sessionId)) {
      setCreateFeeStructureError("The selected class has no valid academic session. Update the class session before creating its fee structure.");
      return;
    }
    if (!feeStructureFields.name.trim()) {
      setCreateFeeStructureError("Enter a name for the fee structure.");
      return;
    }
    if (
      items.length === 0 ||
      items.some((item) => !item.fee_category_id || !Number.isFinite(item.amount) || item.amount <= 0)
    ) {
      setCreateFeeStructureError("Add at least one fee item with a category and an amount greater than zero.");
      return;
    }

    const payload: FeeStructurePayload = {
      session_id: sessionId,
      class_id: Number(selectedClassId),
      name: feeStructureFields.name.trim(),
      billing_period: feeStructureFields.billing_period,
      currency: "KES",
      status: "active",
      effective_from: null,
      effective_to: null,
      items,
    };

    setSavingFeeStructure(true);
    setCreateFeeStructureError(null);
    try {
      const response = await api.finance.createFeeStructure(payload);
      const createdStructure = response.data;
      if (!createdStructure?.id || createdStructure.status !== "active") {
        throw new Error("The fee structure was saved but is not active and cannot be used to generate an invoice.");
      }
      setFeeStructures((current) => [
        ...current.filter((feeStructure) => feeStructure.id !== createdStructure.id),
        createdStructure,
      ]);
      setInvoiceFeeStructureId(String(createdStructure.id));
      setFeeStructureError(null);
      setFeeStructureFields({
        name: "",
        billing_period: "term",
        items: [{ fee_category_id: "", description: "", amount: "" }],
      });
      setShowCreateFeeStructure(false);
    } catch (error: unknown) {
      setCreateFeeStructureError(
        (error as { message?: string })?.message ?? "Could not create the fee structure."
      );
    } finally {
      setSavingFeeStructure(false);
    }
  }

  async function generateStudentInvoice() {
    const resolvedStudentId =
      studentId ??
      (actionData as { createdStudentId?: number } | undefined)?.createdStudentId;
    const resolvedFeeStructureId =
      invoiceFeeStructureId ||
      (feeStructures.length === 1 ? String(feeStructures[0].id) : "");

    if (!resolvedStudentId) {
      setInvoiceError("The student has not been saved yet. Complete the Parent / Guardian step before generating an invoice.");
      return;
    }
    if (!resolvedFeeStructureId) {
      setInvoiceError("Select an active fee structure before generating the invoice.");
      return;
    }

    setSavingInvoice(true);
    setInvoiceError(null);
    try {
      const response = await api.finance.generateInvoices({
        fee_structure_id: Number(resolvedFeeStructureId),
        student_id: resolvedStudentId,
        ...(invoiceDueDate ? { due_date: invoiceDueDate } : {}),
      });
      setInvoiceNumber(response.data.invoice_number ?? "Generated");
      setShowInvoiceDialog(false);
    } catch (error: unknown) {
      setInvoiceError((error as { message?: string })?.message ?? "Could not generate the invoice.");
    } finally {
      setSavingInvoice(false);
    }
  }

  function back() {
    setStepErrors({});
    setStep((current) => current - 1);
  }

  const [selectedClassId, setSelectedClassId] = useState("");
  const [showClassModal, setShowClassModal] = useState(false);
  const [classSaving, setClassSaving] = useState(false);
  const [classModalError, setClassModalError] = useState<string | null>(null);
  const [classModalErrors, setClassModalErrors] = useState<Record<string, string[]>>({});
  const [classNotice, setClassNotice] = useState<string | null>(null);
  const [classFields, setClassFields] = useState({ name: "", grade: "", section: "", capacity: "", class_teacher_id: "", room: "" });
  const [classSubjectQuery, setClassSubjectQuery] = useState("");
  const [selectedClassSubjects, setSelectedClassSubjects] = useState<number[]>([]);

  const filteredClassSubjects = subjects.filter((subject) => {
    const query = classSubjectQuery.trim().toLowerCase();
    return !query ||
      subject.name.toLowerCase().includes(query) ||
      (subject.code ?? "").toLowerCase().includes(query);
  });
  const visibleClassSubjectIds = filteredClassSubjects.map((subject) => subject.id);
  const allVisibleClassSubjectsSelected =
    visibleClassSubjectIds.length > 0 &&
    visibleClassSubjectIds.every((id) => selectedClassSubjects.includes(id));

  const [parentQuery, setParentQuery] = useState("");
  const [parentOptions, setParentOptions] = useState<ParentProfile[]>([]);
  const [selectedParent, setSelectedParent] = useState<ParentProfile | null>(null);
  const [secondaryParentQuery, setSecondaryParentQuery] = useState("");
  const [secondaryParentOptions, setSecondaryParentOptions] = useState<ParentProfile[]>([]);
  const [selectedSecondaryParent, setSelectedSecondaryParent] = useState<ParentProfile | null>(null);
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [showParentModal, setShowParentModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalFields, setModalFields] = useState({
    name: "",
    email: "",
    password: "",
    relationship: "",
    phone: "",
    address: "",
    occupation: "",
    notes: "",
  });

  useEffect(() => {
    if (!showClassModal) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !classSaving) setShowClassModal(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showClassModal, classSaving]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!parentQuery.trim()) {
        setParentOptions([]);
        return;
      }

      try {
        const res = await api.parents.list({ per_page: 10, search: parentQuery });
        setParentOptions(res.data.data ?? []);
      } catch {
        setParentOptions([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [parentQuery]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!secondaryParentQuery.trim()) {
        setSecondaryParentOptions([]);
        return;
      }

      try {
        const res = await api.parents.list({ per_page: 10, search: secondaryParentQuery });
        setSecondaryParentOptions(
          (res.data.data ?? []).filter((parent) => parent.user_id !== selectedParent?.user_id)
        );
      } catch {
        setSecondaryParentOptions([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [secondaryParentQuery, selectedParent?.user_id]);

  function handleParentSelect(parent: ParentProfile) {
    if (selectedSecondaryParent?.user_id === parent.user_id) clearSelectedSecondaryParent();
    setSelectedParent(parent);
    setParentQuery(parent.user?.name ?? "");
    setParentEmail(parent.user?.email ?? "");
    setParentPhone(parent.phone ?? "");
    setParentOptions([]);
  }

  function handleSecondaryParentSelect(parent: ParentProfile) {
    if (selectedParent?.user_id === parent.user_id) return;
    setSelectedSecondaryParent(parent);
    setSecondaryParentQuery(parent.user?.name ?? "");
    setSecondaryParentOptions([]);
  }

  function clearSelectedParent() {
    setSelectedParent(null);
    setParentQuery("");
    setParentEmail("");
    setParentPhone("");
    setParentOptions([]);
    setSecondaryParentOptions((current) => current.filter((parent) => parent.user_id !== selectedParent?.user_id));
  }

  function clearSelectedSecondaryParent() {
    setSelectedSecondaryParent(null);
    setSecondaryParentQuery("");
    setSecondaryParentOptions([]);
  }

  async function handleParentSaved(parent: ParentProfile) {
    setSelectedParent(parent);
    setParentQuery(parent.user?.name ?? "");
    setParentEmail(parent.user?.email ?? "");
    setParentPhone(parent.phone ?? "");
    setShowParentModal(false);
    setModalError(null);
    setModalFields({
      name: "",
      email: "",
      password: "",
      relationship: "",
      phone: "",
      address: "",
      occupation: "",
      notes: "",
    });
  }

  function toggleClassSubject(id: number) {
    setSelectedClassSubjects((current) =>
      current.includes(id) ? current.filter((subjectId) => subjectId !== id) : [...current, id]
    );
  }

  function toggleVisibleClassSubjects() {
    setSelectedClassSubjects((current) => {
      if (allVisibleClassSubjectsSelected) {
        return current.filter((id) => !visibleClassSubjectIds.includes(id));
      }
      return [...new Set([...current, ...visibleClassSubjectIds])];
    });
  }

  async function handleClassCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: CreateClassPayload = {
      name: classFields.name.trim(),
      grade: Number(classFields.grade),
      section: classFields.section.trim(),
      capacity: Number(classFields.capacity),
      subjects: selectedClassSubjects,
      ...(classFields.class_teacher_id ? { class_teacher_id: Number(classFields.class_teacher_id) } : {}),
      ...(classFields.room.trim() ? { room: classFields.room.trim() } : {}),
    };
    const validationErrors = validateClassRoom({ ...payload });
    setClassModalErrors(Object.fromEntries(Object.entries(validationErrors).map(([field, message]) => [field, [message]])));
    setClassModalError(null);
    if (Object.keys(validationErrors).length > 0) return;

    setClassSaving(true);
    try {
      const response = await api.classes.create(payload);
      const createdClass = response.data;
      setAvailableClasses((current) => [
        ...current.filter((classRoom) => classRoom.id !== createdClass.id),
        createdClass,
      ]);
      setClassNotice(`${createdClass.name} was added. Select it from the class list.`);
      setShowClassModal(false);
      setClassFields({ name: "", grade: "", section: "", capacity: "", class_teacher_id: "", room: "" });
      setSelectedClassSubjects([]);
      setClassSubjectQuery("");
      setClassModalErrors({});
    } catch (error: unknown) {
      const apiError = error as { message?: string; errors?: Record<string, string[]> };
      setClassModalError(apiError?.message ?? "Could not add this class. Please check your details and try again.");
      if (apiError?.errors) {
        setClassModalErrors(apiError.errors);
      }
    } finally {
      setClassSaving(false);
    }
  }

  return (
    <div style={s.page} className="responsive-container">
      {/* Breadcrumb */}
      <div style={s.breadcrumb}>
        <Link to="/students" style={{ color: "#4f8ef7", textDecoration: "none", fontWeight: 600 }}>Students</Link>
        <span style={{ color: "#2a3350" }}>›</span>
        <span style={{ color: "#6b7a99" }}>New Student</span>
      </div>

      <h1 style={s.heading}>Add New Student</h1>
      <p style={s.subheading}>Enter the student and guardian details, then finish the optional fee and transport setup.</p>

      <div style={{ marginBottom: "20px" }}>
        <div style={{ height: "4px", background: "#1e2640", borderRadius: "999px", marginBottom: "12px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(step / (STEPS.length - 1)) * 100}%`, background: "linear-gradient(90deg, #4f8ef7, #6366f1)", borderRadius: "999px", transition: "width .3s ease" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))`, gap: "6px" }}>
          {STEPS.map(({ label }, index) => {
            const current = index === step;
            const complete = index < step;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px 4px", borderRadius: "9px", color: current ? "#75a7ff" : complete ? "#4ade80" : "#6b7a99", background: current ? "rgba(79,142,247,0.1)" : "transparent", border: current ? "1px solid rgba(79,142,247,0.25)" : "1px solid transparent", fontSize: "11px", fontWeight: 600, textAlign: "center" }}>
                <span style={{ width: "18px", height: "18px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: complete ? "rgba(74,222,128,0.15)" : current ? "rgba(79,142,247,0.2)" : "#1e2640" }}>
                  {complete ? "✓" : index + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginTop: "15px" }}>
          <span style={{ fontSize: "20px" }}>{STEPS[step].icon}</span>
          <div>
            <p style={{ margin: 0, color: "#e2e8f0", fontSize: "13px", fontWeight: 700 }}>{STEPS[step].label}</p>
            <p style={{ margin: "2px 0 0", color: "#6b7a99", fontSize: "11px" }}>{STEPS[step].desc}</p>
          </div>
          <span style={{ marginLeft: "auto", color: "#6b7a99", fontSize: "11px" }}>Step {step + 1} of {STEPS.length}</span>
        </div>
      </div>

      {studentCreatedNotice && studentId && (
        <div role="status" aria-live="polite" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "14px 16px", marginBottom: "20px", color: "#bbf7d0", fontSize: "13px", lineHeight: 1.6 }}>
          <strong>Student created successfully (ID #{studentId}).</strong>
          <p style={{ margin: "4px 0 12px" }}>The student record is saved. Use Edit to change their details, or delete the student to remove the record.</p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <Link to={`/students/${studentId}/edit`} style={{ display: "inline-flex", alignItems: "center", padding: "7px 12px", borderRadius: "7px", background: "#1d4ed8", color: "#fff", fontSize: "12px", fontWeight: 700, textDecoration: "none" }}>
              Edit student
            </Link>
            {!confirmStudentDelete ? (
              <button type="button" onClick={() => setConfirmStudentDelete(true)} style={{ padding: "7px 12px", borderRadius: "7px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                Delete student
              </button>
            ) : (
              <>
                <span style={{ color: "#fca5a5", fontSize: "12px", fontWeight: 600 }}>Delete this student permanently?</span>
                <Form method="post" action={`/students/${studentId}`}>
                  <input type="hidden" name="intent" value="delete" />
                  <button type="submit" disabled={submitting} style={{ padding: "7px 12px", borderRadius: "7px", background: "#dc2626", border: "none", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? "Deleting…" : "Confirm delete"}
                  </button>
                </Form>
                <button type="button" onClick={() => setConfirmStudentDelete(false)} disabled={submitting} style={{ padding: "7px 12px", borderRadius: "7px", background: "#1e2640", border: "1px solid #2a3350", color: "#cbd5e1", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  Keep student
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {globalError && (
        <div style={s.errorBanner}>
          <span>⚠</span>
          <div>
            <div>{globalError}</div>
            {Object.keys(errors).length > 0 && (
              <ul style={{ margin: "8px 0 0", padding: "0 0 0 16px", fontSize: "12px", color: "#f87171" }}>
                {Object.entries(errors).map(([field, msgs]) => (
                  <li key={field}>{msgs[0]}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <Form
        method="post"
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          if (step < 2) {
            event.preventDefault();
            next(event.currentTarget);
          } else if (!validateStep(step, event.currentTarget)) {
            event.preventDefault();
          }
        }}
      >
        {/* Personal Information */}
        <div style={s.card} className={`responsive-card ${step === 0 ? "" : "hidden"}`}>
          <div style={s.sectionTitle}><SectionIcon emoji="👤" /> Personal Information</div>
          <div style={s.grid2} className="responsive-grid-2">
            <Field label="First Name" required error={stepErrors.first_name ?? errors.first_name?.[0]}>
              <input name="first_name" required placeholder="Amara" style={{ ...s.input, ...(stepErrors.first_name || errors.first_name ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
            <Field label="Last Name" required error={stepErrors.last_name ?? errors.last_name?.[0]}>
              <input name="last_name" required placeholder="Omondi" style={{ ...s.input, ...(stepErrors.last_name || errors.last_name ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
            <Field label="Date of Birth" required error={stepErrors.date_of_birth ?? errors.date_of_birth?.[0]}>
              <input name="date_of_birth" type="date" required style={{ ...s.input, ...(stepErrors.date_of_birth || errors.date_of_birth ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
            <Field label="Gender" required error={stepErrors.gender ?? errors.gender?.[0]}>
              <select name="gender" required defaultValue="male" style={{ ...s.select, ...(stepErrors.gender || errors.gender ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Blood Group" error={stepErrors.blood_group ?? errors.blood_group?.[0]}>
              <select name="blood_group" defaultValue="" style={{ ...s.select, ...(stepErrors.blood_group || errors.blood_group ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">Not specified</option>
                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Religion" error={errors.religion?.[0]}>
              <input name="religion" placeholder="Optional" style={s.input} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
          </div>

          <div style={{ ...s.grid2, marginTop: "16px" }} className="responsive-grid-2">
            <Field label="Category" error={errors.category?.[0]}>
              <select name="category" defaultValue="" style={s.select} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">Not specified</option>
                {["General", "OBC", "SC", "ST", "EWS"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Admission Date" error={stepErrors.admission_date ?? errors.admission_date?.[0]}>
              <input
                name="admission_date"
                type="date"
                value={admissionDate}
                onChange={(event) => {
                  setAdmissionDate(event.target.value);
                  setExistingStudentConfirmed(false);
                  setAdmissionNumber("");
                }}
                style={{ ...s.input, ...(stepErrors.admission_date || errors.admission_date ? s.inputError : {}) }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>
            <div style={{ marginTop: "6px", minHeight: "18px" }}>
              {admissionDateIsPast && !existingStudentConfirmed && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Was this student already enrolled before today but missing from EduNexus?")) {
                      setExistingStudentConfirmed(true);
                      setAdmissionCheck({ status: "idle" });
                      setStepErrors({});
                    }
                  }}
                  style={{ padding: 0, border: 0, background: "none", color: "#75a7ff", fontSize: "11px", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px", cursor: "pointer", fontFamily: "'Sora', sans-serif" }}
                >
                  Already enrolled? Use an official admission number
                </button>
              )}
            </div>
          </div>

          {existingStudentConfirmed && (
            <div style={{ marginTop: "14px", padding: "14px 16px", borderRadius: "10px", background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.2)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <p style={{ margin: 0, color: "#dbeafe", fontSize: "12px", fontWeight: 700 }}>
                  Enter the student’s official admission number
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setExistingStudentConfirmed(false);
                    setAdmissionNumber("");
                    setAdmissionCheck({ status: "idle" });
                    setStepErrors({});
                  }}
                  style={{ padding: 0, border: 0, background: "none", color: "#94a3b8", fontSize: "11px", textDecoration: "underline", cursor: "pointer" }}
                >
                  Use system-generated number
                </button>
              </div>
              <Field label="Official Admission Number" required error={stepErrors.admission_no ?? errors.admission_no?.[0]} hint="The number is checked against existing records before you continue.">
                <input
                  name="admission_no"
                  value={admissionNumber}
                  onChange={(event) => {
                    setAdmissionNumber(event.target.value);
                    setStepErrors((current) => ({ ...current, admission_no: "" }));
                  }}
                  maxLength={255}
                  required
                  autoComplete="off"
                  placeholder="Enter the existing admission number"
                  style={{ ...s.input, ...(stepErrors.admission_no || errors.admission_no ? s.inputError : {}) }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </Field>
              <input type="hidden" name="existing_student" value="1" />

              {admissionCheck.status === "checking" && (
                <p role="status" style={{ margin: "9px 0 0", color: "#93c5fd", fontSize: "11px" }}>Checking existing admission numbers…</p>
              )}
              {admissionCheck.status === "available" && (
                <p role="status" style={{ margin: "9px 0 0", color: "#86efac", fontSize: "11px" }}>This admission number is available.</p>
              )}
              {admissionCheck.status === "error" && (
                <p role="alert" style={{ margin: "9px 0 0", color: "#fca5a5", fontSize: "11px" }}>
                  {admissionCheck.message}{" "}
                  <button type="button" onClick={() => setAdmissionCheckRetry((value) => value + 1)} style={{ padding: 0, border: 0, background: "none", color: "#fecaca", textDecoration: "underline", cursor: "pointer" }}>Retry</button>
                </p>
              )}
              {admissionCheck.status === "duplicate" && (
                <div role="alert" style={{ marginTop: "12px", padding: "12px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.28)" }}>
                  <p style={{ margin: 0, color: "#fca5a5", fontSize: "12px", fontWeight: 700 }}>
                    This admission number already exists in EduNexus and cannot be reused.
                  </p>
                  {admissionCheck.result.student ? (
                    <div style={{ marginTop: "10px", display: "grid", gap: "4px", color: "#cbd5e1", fontSize: "11px" }}>
                      <span><strong>Student:</strong> {admissionCheck.result.student.full_name} (record #{admissionCheck.result.student.id})</span>
                      <span><strong>Class:</strong> {admissionCheck.result.student.class_name ?? "Not assigned"}</span>
                      <span><strong>Admission date:</strong> {admissionCheck.result.student.admission_date ?? "Not recorded"}</span>
                      <span><strong>Record status:</strong> {admissionCheck.result.student.status}</span>
                      {admissionCheck.result.student.status !== "deleted" && (
                        <Link to={`/students/${admissionCheck.result.student.id}`} style={{ width: "fit-content", marginTop: "4px", color: "#93c5fd", textDecoration: "underline" }}>
                          Open the existing student record
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p style={{ margin: "8px 0 0", color: "#cbd5e1", fontSize: "11px" }}>
                      The number is already assigned, but its record is outside your school or unavailable to your account.
                    </p>
                  )}
                  <p style={{ margin: "10px 0 0", color: "#94a3b8", fontSize: "11px", lineHeight: 1.5 }}>
                    Admission numbers already assigned in EduNexus cannot be changed. If the record above is this student, use that record instead of creating a duplicate. If this is a different student, use a system-generated number and distinguish the student by their name, date of birth, class, and guardian details.
                  </p>
                </div>
              )}
              {errors.admission_no?.[0] && !stepErrors.admission_no && admissionCheck.status !== "duplicate" && (
                <p role="alert" style={{ margin: "9px 0 0", color: "#fca5a5", fontSize: "11px" }}>{errors.admission_no[0]}</p>
              )}
            </div>
          )}

          <div style={{ marginTop: "16px" }}>
            <Field label="Address" error={stepErrors.address ?? errors.address?.[0]}>
              <textarea name="address" rows={2} placeholder="Street / City / County" style={{ ...s.textarea, ...(stepErrors.address || errors.address ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
            </Field>
          </div>
        </div>

        {/* Academic Details */}
        <div style={s.card} className={`responsive-card ${step === 1 ? "" : "hidden"}`}>
          <div style={s.sectionTitle}><SectionIcon emoji="🎓" /> Academic Details</div>
          <div style={{ maxWidth: "380px" }} className="responsive-full-width">
            <Field label="Class / Section" required error={stepErrors.class_id ?? errors.class_id?.[0]}>
              <select name="class_id" required value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)} style={{ ...s.select, ...(stepErrors.class_id || errors.class_id ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="" disabled>Select a class…</option>
                {availableClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setClassModalError(null);
                  setClassModalErrors({});
                  setShowClassModal(true);
                }}
                style={{ color: "#75a7ff", background: "none", border: "none", padding: 0, fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'Sora', sans-serif" }}
              >
                + Add a new class
              </button>
              {classNotice && <span role="status" style={{ color: "#4ade80", fontSize: "11px" }}>{classNotice}</span>}
            </div>
          </div>
        </div>

        {/* Parent / Guardian */}
        <div style={s.card} className={`responsive-card ${step === 2 ? "" : "hidden"}`}>
          <div style={s.sectionTitle}><SectionIcon emoji="👨‍👩‍👧" /> Parent / Guardian</div>

          <div style={{ background: "rgba(79,142,247,0.04)", border: "1px solid rgba(79,142,247,0.12)", borderRadius: "9px", padding: "12px 14px", marginBottom: "18px", fontSize: "12px", color: "#6b7a99" }}>
            💡 Search parents by name and select an existing guardian to auto-fill their contact details. If the parent does not exist, click <button type="button" onClick={() => setShowParentModal(true)} style={{ color: "#4f8ef7", textDecoration: "underline", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "12px" }}>Add new parent</button>.
          </div>

          <div style={s.grid3} className="responsive-grid-3">
            <Field label="Primary Parent / Guardian" required error={stepErrors.parent_name ?? errors.parent_name?.[0] ?? errors.parent_id?.[0]} hint="Start typing a guardian name to search existing parent accounts.">
              <div style={{ position: "relative" }}>
                <input
                  name="parent_name"
                  value={selectedParent ? selectedParent.user?.name ?? "" : parentQuery}
                  onChange={(event) => {
                    clearSelectedParent();
                    setParentQuery(event.target.value);
                  }}
                  placeholder="Search parent by name..."
                  style={{ ...s.input, ...(stepErrors.parent_name || errors.parent_name || errors.parent_id ? s.inputError : {} ) }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  autoComplete="off"
                />
                {parentOptions.length > 0 && (
                  <div style={{ position: "absolute", zIndex: 10, top: "100%", left: 0, right: 0, background: "#0a0e1a", border: "1px solid #2a3350", borderRadius: "8px", marginTop: "6px", maxHeight: "220px", overflowY: "auto" }}>
                    {parentOptions.map((parent) => (
                      <button
                        type="button"
                        key={parent.id}
                        onMouseDown={() => handleParentSelect(parent)}
                        style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: "#0a0e1a", border: "none", color: "#e2e8f0", cursor: "pointer" }}
                      >
                        {parent.user?.name}{parent.phone ? ` • ${parent.phone}` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Email Address" error={stepErrors.parent_email ?? errors.parent_email?.[0]} hint="Auto-filled from selected parent.">
              <input
                name="parent_email"
                type="email"
                value={selectedParent ? selectedParent.user?.email ?? "" : parentEmail}
                onChange={(event) => {
                  if (selectedParent) {
                    clearSelectedParent();
                  }
                  setParentEmail(event.target.value);
                }}
                placeholder="john@example.com"
                style={{ ...s.input, ...(stepErrors.parent_email || errors.parent_email ? s.inputError : {}) }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>

            <Field label="Phone Number" required error={stepErrors.parent_phone ?? errors.parent_phone?.[0]} hint="Required. e.g. +254 712 345 678">
              <input
                name="parent_phone"
                type="tel"
                value={selectedParent ? selectedParent.phone ?? "" : parentPhone}
                onChange={(event) => {
                  if (selectedParent) {
                    clearSelectedParent();
                  }
                  setParentPhone(event.target.value);
                }}
                required
                placeholder="+254 7XX XXX XXX"
                style={{ ...s.input, ...(stepErrors.parent_phone || errors.parent_phone ? s.inputError : {}) }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </Field>
          </div>

          {selectedParent?.user?.id && (
            <input type="hidden" name="parent_id" value={selectedParent.user.id} />
          )}

          <div style={{ maxWidth: "420px", marginTop: "16px" }}>
            <Field label="Second Parent / Guardian" hint="Optional. A student can be linked to up to two parent accounts.">
              <div style={{ position: "relative" }}>
                <input
                  value={selectedSecondaryParent?.user?.name ?? secondaryParentQuery}
                  onChange={(event) => {
                    setSelectedSecondaryParent(null);
                    setSecondaryParentQuery(event.target.value);
                  }}
                  placeholder="Search for a second parent..."
                  style={s.input}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  autoComplete="off"
                />
                {secondaryParentOptions.length > 0 && (
                  <div style={{ position: "absolute", zIndex: 10, top: "100%", left: 0, right: 0, background: "#0a0e1a", border: "1px solid #2a3350", borderRadius: "8px", marginTop: "6px", maxHeight: "220px", overflowY: "auto" }}>
                    {secondaryParentOptions.map((parent) => (
                      <button
                        type="button"
                        key={parent.id}
                        onMouseDown={() => handleSecondaryParentSelect(parent)}
                        style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: "#0a0e1a", border: "none", color: "#e2e8f0", cursor: "pointer" }}
                      >
                        {parent.user?.name}{parent.phone ? ` • ${parent.phone}` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedSecondaryParent && (
                <button type="button" onClick={clearSelectedSecondaryParent} style={{ marginTop: "7px", background: "none", border: "none", color: "#75a7ff", cursor: "pointer", padding: 0, fontSize: "11px" }}>
                  Remove second parent
                </button>
              )}
            </Field>
          </div>

          {selectedSecondaryParent?.user_id && (
            <input type="hidden" name="secondary_parent_id" value={selectedSecondaryParent.user_id} />
          )}

          {showParentModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
              <div style={{ width: "100%", maxWidth: "640px", background: "#0f1424", borderRadius: "18px", padding: "24px", border: "1px solid #2a3350", boxSizing: "border-box", position: "relative", maxHeight: "calc(100vh - 60px)", overflowY: "auto" }}>
                <button type="button" onClick={() => setShowParentModal(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: "#a0aec0", fontSize: "22px", cursor: "pointer" }}>×</button>
                <h2 style={{ margin: 0, fontSize: "clamp(20px, 4vw, 24px)", color: "#e2e8f0" }}>Register New Parent</h2>
                <p style={{ marginTop: "10px", color: "#94a3b8" }}>Enter the parent details below. Closing without saving will discard the information.</p>
                <div style={{ display: "grid", gap: "16px", marginTop: "20px" }}>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Full Name</label>
                    <input value={modalFields.name} onChange={(event) => setModalFields({ ...modalFields, name: event.target.value })} placeholder="Parent name" style={s.input} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Email address</label>
                    <input value={modalFields.email} onChange={(event) => setModalFields({ ...modalFields, email: event.target.value })} type="email" placeholder="parent@example.com" style={s.input} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Password</label>
                    <input value={modalFields.password} onChange={(event) => setModalFields({ ...modalFields, password: event.target.value })} type="password" placeholder="Leave empty for default" style={s.input} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Relationship</label>
                    <input value={modalFields.relationship} onChange={(event) => setModalFields({ ...modalFields, relationship: event.target.value })} placeholder="Mother, Father, Guardian" style={s.input} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Phone</label>
                    <input value={modalFields.phone} onChange={(event) => setModalFields({ ...modalFields, phone: event.target.value })} placeholder="+254 7XX XXX XXX" style={s.input} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Occupation</label>
                    <input value={modalFields.occupation} onChange={(event) => setModalFields({ ...modalFields, occupation: event.target.value })} placeholder="Occupation" style={s.input} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Address</label>
                    <textarea value={modalFields.address} onChange={(event) => setModalFields({ ...modalFields, address: event.target.value })} rows={3} placeholder="Street / City / County" style={s.textarea} />
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={s.label}>Notes</label>
                    <textarea value={modalFields.notes} onChange={(event) => setModalFields({ ...modalFields, notes: event.target.value })} rows={3} placeholder="Optional notes" style={s.textarea} />
                  </div>
                  {modalError && <div style={{ color: "#f87171", fontSize: "13px" }}>{modalError}</div>}
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button type="button" onClick={() => setShowParentModal(false)} style={{ flex: 1, padding: "12px 18px", borderRadius: "10px", background: "#1e2640", border: "1px solid #2a3350", color: "#a0aec0", cursor: "pointer" }}>Cancel</button>
                    <button
                      type="button"
                      disabled={modalLoading}
                      onClick={async () => {
                        setModalLoading(true);
                        setModalError(null);
                        try {
                          const res = await api.parents.create({
                            name: modalFields.name,
                                email: modalFields.email?.trim() || undefined,
                            password: modalFields.password || undefined,
                            relationship: modalFields.relationship || undefined,
                            phone: modalFields.phone || undefined,
                            address: modalFields.address || undefined,
                            occupation: modalFields.occupation || undefined,
                            notes: modalFields.notes || undefined,
                          });
                          await handleParentSaved(res.data);
                        } catch (error: unknown) {
                          setModalError((error as { message?: string })?.message ?? "Failed to save parent. Please check the fields.");
                        } finally {
                          setModalLoading(false);
                        }
                      }}
                      style={{ flex: 1, padding: "12px 18px", borderRadius: "10px", border: "none", background: "#4f8ef7", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                    >
                      {modalLoading ? "Saving…" : "Save Parent"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {step === 3 && (
          <div style={s.card} className="responsive-card">
            <div style={s.sectionTitle}><SectionIcon emoji="🧾" /> Student Fees</div>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6, margin: "0 0 16px" }}>
              Generate an invoice for this student using an active fee structure that applies to the selected class.
            </p>
            {invoiceNumber ? (
              <div role="status" style={{ color: "#4ade80", fontSize: "13px", marginBottom: "14px" }}>
                Invoice {invoiceNumber === "Generated" ? "generated successfully" : `#${invoiceNumber} generated successfully`}.
              </div>
            ) : (
              <p style={{ color: "#6b7a99", fontSize: "12px", margin: "0 0 14px" }}>No invoice generated yet. This step is optional.</p>
            )}
            <button type="button" onClick={openInvoiceDialog} style={{ ...s.btnSubmit, flex: "none", padding: "11px 18px" }}>
              {invoiceNumber ? "Generate another invoice" : "Generate invoice"}
            </button>
          </div>
        )}

        {step === 4 && (
          <div style={s.card} className="responsive-card">
            <div style={s.sectionTitle}><SectionIcon emoji="🚌" /> Student Transport</div>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6, margin: "0 0 16px" }}>
              Assign this student to a route and pickup/drop-off stop. You can also create a route or edit an existing one here.
            </p>
            {routeAssignmentComplete ? (
              <div role="status" style={{ color: "#4ade80", fontSize: "13px", marginBottom: "14px" }}>
                Student assigned to {routes.find((route) => route.id === Number(selectedRouteId))?.name ?? "the selected route"}.
              </div>
            ) : (
              <p style={{ color: "#6b7a99", fontSize: "12px", margin: "0 0 14px" }}>No route assigned yet. This step is optional.</p>
            )}
            <button type="button" onClick={openTransportDialog} style={{ ...s.btnSubmit, flex: "none", padding: "11px 18px" }}>
              {routeAssignmentComplete ? "Change route assignment" : "Assign transport route"}
            </button>
          </div>
        )}

        {/* Step navigation */}
        <div style={{ ...s.actions, justifyContent: "space-between", marginTop: "20px" }} className="responsive-actions">
          <div>
            {step > 0 && step < 3 && (
              <button type="button" onClick={back} style={{ ...s.btnCancel, flex: "none", padding: "11px 20px" }}>
                ← Back
              </button>
            )}
            {step === 4 && (
              <button type="button" onClick={back} style={{ ...s.btnCancel, flex: "none", padding: "11px 20px" }}>
                ← Back
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link to="/students" style={{ ...s.btnCancel, flex: "none", padding: "11px 16px" }}>Cancel</Link>
            {step < 2 ? (
              <button type="button" onClick={(event) => next(event.currentTarget.form)} style={{ ...s.btnSubmit, flex: "none", padding: "11px 20px" }}>
                Continue →
              </button>
            ) : step === 2 ? (
              studentId ? (
                <button type="button" onClick={() => setStep(3)} style={{ ...s.btnSubmit, flex: "none", padding: "11px 20px" }}>
                  Continue to fees →
                </button>
              ) : (
                <button type="submit" name="intent" value="create_student" disabled={submitting} style={{ ...s.btnSubmit, flex: "none", padding: "11px 20px", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Creating student…" : "Create student & continue →"}
                </button>
              )
            ) : step === 3 ? (
              <button type="button" onClick={() => setStep(4)} style={{ ...s.btnSubmit, flex: "none", padding: "11px 20px" }}>
                Continue to transport →
              </button>
            ) : (
              <Link to={studentId ? `/students/${studentId}` : "/students"} style={{ ...s.btnSubmit, flex: "none", padding: "11px 20px", textDecoration: "none" }}>
                Finish enrolment ✓
              </Link>
            )}
          </div>
        </div>
      </Form>

      {showInvoiceDialog && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingInvoice) setShowInvoiceDialog(false); }} style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(3, 7, 18, 0.78)", backdropFilter: "blur(6px)", overflowY: "auto" }}>
          <section role="dialog" aria-modal="true" aria-labelledby="student-invoice-title" style={{ width: "100%", maxWidth: "560px", background: "#0f1424", border: "1px solid #293555", borderRadius: "16px", padding: "24px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <h2 id="student-invoice-title" style={{ margin: 0, color: "#e2e8f0", fontSize: "20px" }}>Generate student invoice</h2>
                <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "12px" }}>Invoice will be issued to student #{studentId}.</p>
              </div>
              <button type="button" aria-label="Close invoice dialog" onClick={() => setShowInvoiceDialog(false)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "22px", cursor: "pointer" }}>×</button>
            </div>

            {feeStructureError && <div role="alert" style={s.errorBanner}>{feeStructureError}</div>}
            {invoiceError && <div role="alert" style={s.errorBanner}>{invoiceError}</div>}

            {loadingFeeStructures ? (
              <p style={{ color: "#94a3b8", fontSize: "13px" }}>Loading active fee structures…</p>
            ) : (
              <>
                <div style={{ display: "grid", gap: "14px" }}>
                  <Field label="Fee Structure" required>
                    <select value={invoiceFeeStructureId} onChange={(event) => setInvoiceFeeStructureId(event.target.value)} style={s.select} disabled={feeStructures.length === 0}>
                      <option value="">Select a fee structure…</option>
                      {feeStructures.map((feeStructure) => (
                        <option key={feeStructure.id} value={feeStructure.id}>
                          {feeStructure.name} ({feeStructure.currency}){feeStructure.class_room ? ` — ${feeStructure.class_room.name}` : " — All classes"}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {feeStructures.length === 0 && !feeStructureError && (
                    <div style={{ display: "grid", gap: "8px" }}>
                      <p style={{ color: "#fbbf24", fontSize: "12px", margin: 0 }}>No active fee structures are available for this student’s class.</p>
                      <button type="button" onClick={openCreateFeeStructureDialog} style={{ justifySelf: "start", padding: 0, color: "#75a7ff", background: "none", border: "none", textDecoration: "underline", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                        + Add a new fee structure
                      </button>
                    </div>
                  )}
                  <Field label="Due Date" hint="Optional">
                    <input type="date" value={invoiceDueDate} onChange={(event) => setInvoiceDueDate(event.target.value)} style={s.input} />
                  </Field>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "22px" }}>
                  <button type="button" onClick={() => setShowInvoiceDialog(false)} style={{ ...s.btnCancel, flex: "none", padding: "10px 16px" }}>Cancel</button>
                  <button type="button" onClick={generateStudentInvoice} disabled={savingInvoice || feeStructures.length === 0} style={{ ...s.btnSubmit, flex: "none", padding: "10px 16px", opacity: savingInvoice || feeStructures.length === 0 ? 0.6 : 1 }}>
                    {savingInvoice ? "Generating…" : "Generate invoice"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {showCreateFeeStructure && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingFeeStructure) setShowCreateFeeStructure(false); }} style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(3, 7, 18, 0.84)", backdropFilter: "blur(6px)", overflowY: "auto" }}>
          <section role="dialog" aria-modal="true" aria-labelledby="create-fee-structure-title" style={{ width: "100%", maxWidth: "640px", maxHeight: "calc(100vh - 40px)", overflowY: "auto", background: "#0f1424", border: "1px solid #293555", borderRadius: "16px", padding: "24px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <h2 id="create-fee-structure-title" style={{ margin: 0, color: "#e2e8f0", fontSize: "20px" }}>Create fee structure</h2>
                <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "12px" }}>
                  This active structure will be scoped to {availableClasses.find((classRoom) => classRoom.id === Number(selectedClassId))?.name ?? "the selected class"}.
                </p>
              </div>
              <button type="button" aria-label="Close fee structure dialog" disabled={savingFeeStructure} onClick={() => setShowCreateFeeStructure(false)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "22px", cursor: "pointer" }}>×</button>
            </div>

            {createFeeStructureError && <div role="alert" style={s.errorBanner}>{createFeeStructureError}</div>}
            {loadingFeeStructureForm ? (
              <p style={{ color: "#94a3b8", fontSize: "13px" }}>Loading academic sessions and fee categories…</p>
            ) : feeCategories.length === 0 ? (
              <div style={{ display: "grid", gap: "12px" }}>
                <p style={{ margin: 0, color: "#fbbf24", fontSize: "13px" }}>Add an active fee category before creating a fee structure.</p>
                <Link to="/finance/fee-categories" style={{ color: "#75a7ff", fontSize: "13px" }}>Manage fee categories →</Link>
              </div>
            ) : academicSessions.length === 0 ? (
              <p style={{ color: "#fbbf24", fontSize: "13px" }}>There are no academic sessions available for fee structures.</p>
            ) : (
              <>
                <div style={{ display: "grid", gap: "14px" }}>
                  <Field label="Structure Name" required>
                    <input value={feeStructureFields.name} onChange={(event) => setFeeStructureFields((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Term 1 Tuition" style={s.input} />
                  </Field>
                  <div style={s.grid2} className="responsive-grid-2">
                    <Field label="Academic Session" required>
                      <select value={availableClasses.find((classRoom) => classRoom.id === Number(selectedClassId))?.session_id ?? ""} style={s.select} disabled>
                        {academicSessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Billing Period" required>
                      <select value={feeStructureFields.billing_period} onChange={(event) => setFeeStructureFields((current) => ({ ...current, billing_period: event.target.value }))} style={s.select}>
                        <option value="term">Term</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                        <option value="once">One-time</option>
                      </select>
                    </Field>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                      <span style={s.label}>Fee Items</span>
                      <button type="button" onClick={() => setFeeStructureFields((current) => ({ ...current, items: [...current.items, { fee_category_id: "", description: "", amount: "" }] }))} style={{ color: "#75a7ff", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}>+ Add item</button>
                    </div>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {feeStructureFields.items.map((item, index) => (
                        <div key={index} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(100px, 0.7fr) auto", gap: "8px", alignItems: "center" }}>
                          <select aria-label={`Fee item ${index + 1} category`} value={item.fee_category_id} onChange={(event) => setFeeStructureFields((current) => ({ ...current, items: current.items.map((currentItem, itemIndex) => itemIndex === index ? { ...currentItem, fee_category_id: event.target.value } : currentItem) }))} style={s.select}>
                            <option value="">Select category…</option>
                            {feeCategories.filter((category) => category.is_active).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                          </select>
                          <input aria-label={`Fee item ${index + 1} amount`} type="number" min="0.01" step="0.01" value={item.amount} onChange={(event) => setFeeStructureFields((current) => ({ ...current, items: current.items.map((currentItem, itemIndex) => itemIndex === index ? { ...currentItem, amount: event.target.value } : currentItem) }))} placeholder="Amount (KES)" style={s.input} />
                          {feeStructureFields.items.length > 1 && <button type="button" aria-label={`Remove fee item ${index + 1}`} onClick={() => setFeeStructureFields((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))} style={{ color: "#f87171", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>×</button>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "22px" }}>
                  <button type="button" onClick={() => setShowCreateFeeStructure(false)} disabled={savingFeeStructure} style={{ ...s.btnCancel, flex: "none", padding: "10px 16px" }}>Cancel</button>
                  <button type="button" onClick={createFeeStructure} disabled={savingFeeStructure} style={{ ...s.btnSubmit, flex: "none", padding: "10px 16px", opacity: savingFeeStructure ? 0.6 : 1 }}>
                    {savingFeeStructure ? "Creating…" : "Create active structure"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {showTransportDialog && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingRoute && !savingRouteAssignment) setShowTransportDialog(false); }} style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(3, 7, 18, 0.78)", backdropFilter: "blur(6px)", overflowY: "auto" }}>
          <section role="dialog" aria-modal="true" aria-labelledby="student-transport-title" style={{ width: "100%", maxWidth: "600px", background: "#0f1424", border: "1px solid #293555", borderRadius: "16px", padding: "24px", boxSizing: "border-box", maxHeight: "calc(100vh - 40px)", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <h2 id="student-transport-title" style={{ margin: 0, color: "#e2e8f0", fontSize: "20px" }}>{showRouteEditor ? (editingRouteId ? "Edit transport route" : "Add transport route") : "Assign transport route"}</h2>
                <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "12px" }}>Student #{studentId}</p>
              </div>
              <button type="button" aria-label="Close transport dialog" onClick={() => { setShowRouteEditor(false); setShowTransportDialog(false); }} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "22px", cursor: "pointer" }}>×</button>
            </div>

            {loadingTransportData ? (
              <p style={{ color: "#94a3b8", fontSize: "13px" }}>Loading routes and fleet resources…</p>
            ) : transportDataError ? (
              <div role="alert" style={s.errorBanner}>{transportDataError}</div>
            ) : showRouteEditor ? (
              <div style={{ display: "grid", gap: "14px" }}>
                {routeEditorError && <div role="alert" style={s.errorBanner}>{routeEditorError}</div>}
                <Field label="Route Name" required>
                  <input value={routeFields.name} onChange={(event) => setRouteFields((current) => ({ ...current, name: event.target.value }))} style={s.input} />
                </Field>
                <div style={s.grid2} className="responsive-grid-2">
                  <Field label="Vehicle" required>
                    <select value={routeFields.vehicle_id} onChange={(event) => setRouteFields((current) => ({ ...current, vehicle_id: event.target.value }))} style={s.select}>
                      <option value="">Select vehicle…</option>
                      {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registration_number} ({vehicle.make ?? ""} {vehicle.model ?? ""})</option>)}
                    </select>
                  </Field>
                  <Field label="Driver" required>
                    <select value={routeFields.driver_id} onChange={(event) => setRouteFields((current) => ({ ...current, driver_id: event.target.value }))} style={s.select}>
                      <option value="">Select driver…</option>
                      {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Monthly Fee (KES)" required>
                  <input type="number" min="0" step="0.01" value={routeFields.monthly_fee} onChange={(event) => setRouteFields((current) => ({ ...current, monthly_fee: event.target.value }))} style={s.input} />
                </Field>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={s.label}>Route Stops</span>
                    <button type="button" onClick={() => setRouteFields((current) => ({ ...current, stops: [...current.stops, { name: "", pickup_time: "", drop_time: "" }] }))} style={{ color: "#75a7ff", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}>+ Add stop</button>
                  </div>
                  {routeFields.stops.map((stop, index) => (
                    <div key={index} style={{ ...s.grid3, marginBottom: "10px" }} className="responsive-grid-3">
                      <input aria-label={`Stop ${index + 1} name`} placeholder="Stop name" value={stop.name} onChange={(event) => setRouteFields((current) => ({ ...current, stops: current.stops.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))} style={s.input} />
                      <input aria-label={`Stop ${index + 1} pickup time`} type="time" value={stop.pickup_time} onChange={(event) => setRouteFields((current) => ({ ...current, stops: current.stops.map((item, itemIndex) => itemIndex === index ? { ...item, pickup_time: event.target.value } : item) }))} style={s.input} />
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input aria-label={`Stop ${index + 1} drop-off time`} type="time" value={stop.drop_time} onChange={(event) => setRouteFields((current) => ({ ...current, stops: current.stops.map((item, itemIndex) => itemIndex === index ? { ...item, drop_time: event.target.value } : item) }))} style={s.input} />
                        {routeFields.stops.length > 1 && <button type="button" aria-label={`Remove stop ${index + 1}`} onClick={() => setRouteFields((current) => ({ ...current, stops: current.stops.filter((_, itemIndex) => itemIndex !== index) }))} style={{ color: "#f87171", background: "none", border: "none", cursor: "pointer" }}>×</button>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" onClick={() => setShowRouteEditor(false)} disabled={savingRoute} style={{ ...s.btnCancel, flex: "none", padding: "10px 16px" }}>Cancel</button>
                  <button type="button" onClick={saveRoute} disabled={savingRoute} style={{ ...s.btnSubmit, flex: "none", padding: "10px 16px", opacity: savingRoute ? 0.6 : 1 }}>{savingRoute ? "Saving…" : editingRouteId ? "Save route" : "Create route"}</button>
                </div>
              </div>
            ) : (
              <>
                {routeAssignmentError && <div role="alert" style={s.errorBanner}>{routeAssignmentError}</div>}
                <Field label="Route" required>
                  <select value={selectedRouteId} onChange={(event) => {
                    setSelectedRouteId(event.target.value);
                    setRouteAssignmentError(null);
                    const route = routes.find((item) => item.id === Number(event.target.value));
                    setSelectedRouteStop(route?.stops?.[0]?.name ?? "");
                  }} style={s.select}>
                    <option value="">Select a route…</option>
                    {routes.map((route) => <option key={route.id} value={route.id}>{route.name} — {route.vehicle?.registration_number ?? "No vehicle"}</option>)}
                  </select>
                </Field>
                <div style={{ marginTop: "14px" }}>
                  <Field label="Pickup / Drop-off Stop" required>
                    <select value={selectedRouteStop} onChange={(event) => setSelectedRouteStop(event.target.value)} style={s.select} disabled={!routes.find((route) => route.id === Number(selectedRouteId))?.stops?.length}>
                      <option value="">Select a route stop…</option>
                      {routes.find((route) => route.id === Number(selectedRouteId))?.stops?.map((stop, index) => (
                        <option key={`${stop.name}-${index}`} value={stop.name}>{stop.name} (Pick: {stop.pickup_time} / Drop: {stop.drop_time})</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" onClick={() => openRouteEditor()} style={{ ...s.btnCancel, flex: "none", padding: "10px 14px" }}>+ Add route</button>
                    <button type="button" onClick={() => openRouteEditor(routes.find((route) => route.id === Number(selectedRouteId)))} disabled={!selectedRouteId} style={{ ...s.btnCancel, flex: "none", padding: "10px 14px", opacity: selectedRouteId ? 1 : 0.5 }}>Edit selected</button>
                  </div>
                  <button type="button" onClick={assignStudentToRoute} disabled={savingRouteAssignment || !studentId || routes.length === 0} style={{ ...s.btnSubmit, flex: "none", padding: "10px 16px", opacity: savingRouteAssignment || !studentId || routes.length === 0 ? 0.6 : 1 }}>
                    {savingRouteAssignment ? "Assigning…" : "Assign to student"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {showClassModal && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !classSaving) setShowClassModal(false);
          }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(3, 7, 18, 0.78)", backdropFilter: "blur(6px)", overflowY: "auto" }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-class-title"
            style={{ width: "100%", maxWidth: "780px", maxHeight: "calc(100vh - 40px)", overflowY: "auto", background: "linear-gradient(145deg, #121a2e, #0d1220)", border: "1px solid #293555", borderRadius: "20px", padding: "clamp(20px, 4vw, 32px)", boxSizing: "border-box", boxShadow: "0 24px 80px rgba(0,0,0,0.55)" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "24px" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "999px", background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.2)", color: "#75a7ff", fontSize: "11px", fontWeight: 700, marginBottom: "12px" }}>
                  🏫 Academic Setup
                </div>
                <h2 id="add-class-title" style={{ margin: 0, color: "#e2e8f0", fontSize: "22px", fontWeight: 700 }}>Add New Class Room</h2>
                <p style={{ margin: "7px 0 0", color: "#8391ad", fontSize: "13px", lineHeight: 1.6 }}>Configure the class details below. You can select it for the student after saving.</p>
              </div>
              <button type="button" aria-label="Close dialog" disabled={classSaving} onClick={() => setShowClassModal(false)} style={{ background: "#1b2439", border: "1px solid #2a3652", borderRadius: "9px", width: "36px", height: "36px", color: "#a0aec0", fontSize: "21px", cursor: "pointer", flexShrink: 0 }}>×</button>
            </div>

            {classModalError && (
              <div role="alert" style={{ ...s.errorBanner, marginBottom: "20px" }}>
                <span>⚠</span>
                <div>{classModalError}</div>
              </div>
            )}

            <form onSubmit={handleClassCreate} noValidate style={{ background: "rgba(15,23,42,0.72)", border: "1px solid rgba(51,65,85,0.7)", borderRadius: "18px", padding: "clamp(16px, 3vw, 26px)", display: "grid", gap: "22px" }}>
              <div style={s.grid2} className="responsive-grid-2">
                <Field label="Class Name" required error={classModalErrors.name?.[0]}>
                  <input autoFocus required maxLength={50} value={classFields.name} onChange={(event) => setClassFields({ ...classFields, name: event.target.value })} placeholder="e.g. Form 4 East" style={{ ...s.input, marginTop: "8px", ...(classModalErrors.name ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
                </Field>
                <Field label="Grade Level" required error={classModalErrors.grade?.[0]}>
                  <input required type="number" min="1" max="12" value={classFields.grade} onChange={(event) => setClassFields({ ...classFields, grade: event.target.value })} placeholder="1-12" style={{ ...s.input, marginTop: "8px", ...(classModalErrors.grade ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
                </Field>
              </div>

              <div style={s.grid2} className="responsive-grid-2">
                <Field label="Section" required error={classModalErrors.section?.[0]} hint="For example: A, B, or North">
                  <input required maxLength={5} value={classFields.section} onChange={(event) => setClassFields({ ...classFields, section: event.target.value })} placeholder="e.g. A, B, North" style={{ ...s.input, marginTop: "8px", ...(classModalErrors.section ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
                </Field>
                <Field label="Capacity" required error={classModalErrors.capacity?.[0]}>
                  <input required type="number" min="1" value={classFields.capacity} onChange={(event) => setClassFields({ ...classFields, capacity: event.target.value })} placeholder="e.g. 40" style={{ ...s.input, marginTop: "8px", ...(classModalErrors.capacity ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
                </Field>
              </div>

              <div style={s.grid2} className="responsive-grid-2">
                <Field label="Class Teacher" error={classModalErrors.class_teacher_id?.[0]}>
                  <select value={classFields.class_teacher_id} onChange={(event) => setClassFields({ ...classFields, class_teacher_id: event.target.value })} style={{ ...s.select, marginTop: "8px" }} onFocus={focusStyle} onBlur={blurStyle}>
                    <option value="">No teacher assigned</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>{teacher.user?.name ?? `Teacher #${teacher.id}`}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Room Location" error={classModalErrors.room?.[0]}>
                  <input maxLength={50} value={classFields.room} onChange={(event) => setClassFields({ ...classFields, room: event.target.value })} placeholder="e.g. Lab 3 / Room 102" style={{ ...s.input, marginTop: "8px", ...(classModalErrors.room ? s.inputError : {}) }} onFocus={focusStyle} onBlur={blurStyle} />
                </Field>
              </div>

              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <legend style={{ ...s.label, marginBottom: "8px" }}>Assigned Subjects</legend>
                {selectedClassSubjects.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                    {subjects.filter((subject) => selectedClassSubjects.includes(subject.id)).map((subject) => (
                      <span key={subject.id} style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "999px", background: "#1e293b", border: "1px solid #334155", padding: "5px 10px", color: "#e2e8f0", fontSize: "12px" }}>
                        {subject.name}
                        <button type="button" aria-label={`Remove ${subject.name}`} onClick={() => toggleClassSubject(subject.id)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ border: "1px solid #2a3350", borderRadius: "14px", background: "rgba(2,6,23,0.55)", padding: "14px" }}>
                  {subjects.length === 0 ? (
                    <p style={{ color: "#6b7a99", fontSize: "12px", textAlign: "center", padding: "20px 0", margin: 0 }}>No subjects available in the system.</p>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
                        <div>
                          <p style={{ margin: 0, color: "#e2e8f0", fontSize: "13px", fontWeight: 600 }}>Pick subjects for this class</p>
                          <p style={{ margin: "4px 0 0", color: "#6b7a99", fontSize: "11px" }}>Search, select, or remove subjects from the list below.</p>
                        </div>
                        <button type="button" onClick={toggleVisibleClassSubjects} style={{ border: "1px solid #334155", borderRadius: "10px", padding: "7px 10px", background: "#1e293b", color: "#cbd5e1", cursor: "pointer", fontSize: "12px" }}>
                          {selectedClassSubjects.length} selected · {allVisibleClassSubjectsSelected ? "Deselect all" : "Select all"}
                        </button>
                      </div>
                      <input value={classSubjectQuery} onChange={(event) => setClassSubjectQuery(event.target.value)} placeholder="Search subjects..." style={{ ...s.input, marginBottom: "12px" }} />
                      <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                        <ul style={{ listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px", padding: 0, margin: 0 }}>
                          {filteredClassSubjects.map((subject) => (
                            <li key={subject.id}>
                              <label htmlFor={`new-class-subject-${subject.id}`} style={{ display: "flex", alignItems: "center", gap: "9px", minHeight: "44px", padding: "9px 10px", border: "1px solid #26324a", borderRadius: "10px", background: "rgba(15,23,42,0.65)", cursor: "pointer" }}>
                                <input id={`new-class-subject-${subject.id}`} type="checkbox" checked={selectedClassSubjects.includes(subject.id)} onChange={() => toggleClassSubject(subject.id)} style={{ accentColor: "#4f8ef7", flexShrink: 0 }} />
                                <span style={{ display: "grid", gap: "3px" }}>
                                  <span style={{ color: "#e2e8f0", fontSize: "12px", fontWeight: 600 }}>{subject.name}</span>
                                  {(subject.code || subject.type) && <span style={{ color: "#8391ad", fontSize: "10px" }}>{subject.code}{subject.code && subject.type ? " · " : ""}{subject.type}</span>}
                                </span>
                                {subject.exams_count ? <span style={{ marginLeft: "auto", color: "#6b7a99", fontSize: "10px", whiteSpace: "nowrap" }}>{subject.exams_count} exams</span> : null}
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </fieldset>

              <div style={{ display: "flex", gap: "12px", paddingTop: "18px", borderTop: "1px solid #26324a", flexWrap: "wrap" }}>
                <button type="button" disabled={classSaving} onClick={() => setShowClassModal(false)} style={{ ...s.btnCancel, flex: "1 1 140px", padding: "12px 18px" }}>Close</button>
                <button type="submit" disabled={classSaving} style={{ ...s.btnSubmit, flex: "2 1 220px", padding: "12px 18px", opacity: classSaving ? 0.7 : 1 }}>
                  {classSaving ? "Creating Class Room…" : "Create Class Room"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .responsive-container { padding: 12px !important; }
          .responsive-card { padding: 16px !important; }
          .responsive-grid-2 { grid-template-columns: 1fr !important; }
          .responsive-grid-3 { grid-template-columns: 1fr !important; }
          .responsive-full-width { max-width: 100% !important; }
          .responsive-actions { flex-direction: column !important; }
          .responsive-actions > * { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}