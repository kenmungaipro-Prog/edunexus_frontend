// ============================================================
// app/lib/api.ts
// EduNexus — Fully-typed API client
// ============================================================

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from "axios";

// ============================================================
// § 1 — Shared primitives
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    meta: PaginationMeta;
    links: PaginationLinks;
  };
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface ValidationError {
  success: false;
  message: string;
  errors: Record<string, string[]>;
}

// ============================================================
// § 2 — Domain types
// ============================================================

export type UserRole =
  | "superadmin"
  | "admin"
  | "teacher"
  | "accountant"
  | "librarian"
  | "receptionist"
  | "student"
  | "parent";

export interface User {
  id: number;
  school_id: number | null;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  profile_photo: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface School {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  principal: string | null;
  logo: string | null;
  website: string | null;
  established_year: number | null;
  board: string | null;
  affiliation_no: string | null;
  school_code: string | null;
}

export interface AcademicSession {
  id: number;
  school_id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface ClassRoom {
  id: number;
  school_id: number;
  session_id: number;
  name: string;
  grade: number;
  section: string;
  class_teacher_id: number | null;
  capacity: number;
  room: string | null;
  students_count?: number;
  occupancy_rate?: number;
  class_teacher?: Teacher;
}

export interface Subject {
  id: number;
  school_id: number;
  name: string;
  code: string | null;
  type: "core" | "elective" | "activity";
  exams_count?: number;
  teachers_count?: number;
}

export interface Student {
  id: number;
  school_id: number;
  session_id: number;
  class_id: number;
  parent_id: number | null;
  admission_no: string;
  roll_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  blood_group: string | null;
  address: string | null;
  profile_photo: string | null;
  status: "active" | "inactive" | "alumni";
  admission_date: string | null;
  religion: string | null;
  category: string | null;
  attendance_percentage: number;
  fee_status: "paid" | "pending" | "overdue";
  class_room?: ClassRoom;
  parent?: User;
  grades?: Grade[];
  fees?: Fee[];
  created_at: string;
}

export interface ParentProfile {
  id: number;
  school_id: number;
  user_id: number;
  relationship: string | null;
  phone: string | null;
  address: string | null;
  occupation: string | null;
  notes: string | null;
  user?: User;
  school?: School;
  children?: Student[];
  created_at: string;
  updated_at: string;
}

export interface CreateParentPayload {
  name: string;
  email: string;
  password?: string;
  relationship?: string;
  phone?: string;
  address?: string;
  occupation?: string;
  notes?: string;
}

export interface UpdateParentPayload {
  name?: string;
  email?: string;
  password?: string;
  relationship?: string;
  phone?: string;
  address?: string;
  occupation?: string;
  notes?: string;
}

export interface ParentStats {
  total: number;
  active: number;
  inactive: number;
  parents_with_no_children: number;
  parents_with_multiple_children: number;
  total_children: number;
}

export interface Teacher {
  id: number;
  user_id: number;
  school_id: number;
  employee_id: string;
  phone: string | null;
  department: string | null;
  qualification: string | null;
  experience_yrs: number;
  join_date: string | null;
  salary: number | null;
  status: "active" | "inactive" | "on_leave";
  user?: User;
  subjects?: Subject[];
  class_rooms?: ClassRoom[];
}

export interface TeacherPerformance {
  avg_student_score: number;
  attendance_rate: number;
  classes_taught: number;
  students_count: number;
}

export type AttendanceStatus = "present" | "absent" | "late" | "holiday" | "excused";

export interface Attendance {
  id: number;
  student_id: number;
  class_id: number;
  date: string;
  status: AttendanceStatus;
  marked_by: number;
  remarks: string | null;
  student?: Student;
  class_room?: ClassRoom;
}

export interface AttendanceStats {
  present_today: number;
  absent_today: number;
  late_today: number;
  overall_rate: number;
  weekly_trend: Array<{ date: string; day: string; rate: number }>;
  class_wise: Array<{ class: string; present: number; absent: number; late: number }>;
}

export interface TimetableSlot {
  id: number;
  class_id: number;
  subject_id: number;
  teacher_id: number;
  day_of_week: 1 | 2 | 3 | 4 | 5 | 6;
  period_number: number;
  start_time: string;
  end_time: string;
  room: string | null;
  subject?: Subject;
  teacher?: Teacher;
}

export type ExamStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

export interface Exam {
  id: number;
  class_id: number;
  subject_id: number;
  session_id: number;
  created_by: number;
  invigilator_id: number | null;
  title: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  total_marks: number;
  passing_marks: number;
  room: string | null;
  instructions: string | null;
  status: ExamStatus;
  pass_rate?: number;
  class_room?: ClassRoom;
  subject?: Subject;
  invigilator?: Teacher;
  grades?: Grade[];
}

export interface Grade {
  id: number;
  exam_id: number;
  student_id: number;
  entered_by: number;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  letter_grade: "A+" | "A" | "B+" | "B" | "C" | "D" | "F";
  status: "pass" | "fail";
  remarks: string | null;
  exam?: Exam;
  student?: Student;
}

export interface GradeDistribution {
  letter_grade: string;
  count: number;
  avg_pct: number;
}

export interface SubjectPerformance {
  highest: number;
  average: number;
  lowest: number;
  pass_rate: number;
  count: number;
}

export type PaymentMethod = "cash" | "mpesa" | "bank_transfer" | "bank_deposit" | "card" | "cheque" | "online";
export type FeeStatus = "paid" | "pending" | "overdue" | "waived" | "reversed";

export interface FeeType {
  id: number;
  school_id: number;
  name: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "annual" | "one_time";
  description: string | null;
}

export interface Fee {
  id: number;
  receipt_no: string;
  student_id: number;
  fee_type_id: number;
  session_id: number;
  collected_by: number;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  status: FeeStatus;
  paid_at: string | null;
  remarks: string | null;
  student?: Student;
  fee_type?: FeeType;
  collected_by_user?: User;
  created_at: string;
}

export interface FeeSummary {
  total_budget: number;
  total_collected: number;
  total_pending: number;
  defaulters: number;
  collection_rate: number;
  by_type: Array<{ type: string; amount: number; collected: number; rate: number }>;
  monthly: Array<{ month: string; collected: number }>;
}

export interface FeeCategory {
  id: number;
  school_id: number;
  name: string;
  code: string;
  description: string | null;
  default_amount: number;
  is_active: boolean;
}

export interface FeeStructureItem {
  id: number;
  fee_structure_id: number;
  fee_category_id: number;
  description: string | null;
  amount: number;
  is_mandatory: boolean;
  is_recurring: boolean;
  fee_category?: FeeCategory;
}

export interface FeeStructure {
  id: number;
  school_id: number;
  session_id: number;
  class_id: number | null;
  name: string;
  billing_period: string;
  currency: string;
  status: "draft" | "active" | "inactive";
  effective_from: string | null;
  effective_to: string | null;
  items?: FeeStructureItem[];
  class_room?: ClassRoom | null;
  session?: AcademicSession | null;
}

export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled" | "reversed";

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  fee_category_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total: number;
  fee_category?: FeeCategory | null;
}

export interface Invoice {
  id: number;
  school_id: number;
  student_id: number;
  session_id: number | null;
  class_id: number | null;
  invoice_number: string;
  issue_date: string | null;
  due_date: string | null;
  currency: string;
  subtotal: number;
  discount_total: number;
  waiver_total: number;
  penalty_total: number;
  total: number;
  amount_paid: number;
  balance: number;
  status: InvoiceStatus;
  student?: Student;
  items?: InvoiceItem[];
}

export type FinancePaymentStatus =
  | "pending"
  | "processing"
  | "successful"
  | "failed"
  | "reversed"
  | "refunded"
  | "partially_allocated"
  | "fully_allocated"
  | "suspicious"
  | "reconciled";

export interface Receipt {
  id: number;
  school_id: number;
  payment_id: number;
  receipt_number: string;
  receipt_date: string;
  status: "issued" | "reversed" | "void";
  payment?: FinancePayment;
}

export interface FinancePayment {
  id: number;
  school_id: number;
  student_id: number;
  payment_number: string;
  payment_method: PaymentMethod;
  payment_channel: string | null;
  currency: string;
  amount: number;
  payment_date: string;
  reference_number: string | null;
  external_transaction_id: string | null;
  payer_name: string | null;
  payer_phone: string | null;
  status: FinancePaymentStatus;
  student?: Student;
  receipt?: Receipt | null;
  allocations?: Array<{ id: number; amount_allocated: number; invoice?: Invoice }>;
}

export interface MpesaStatusEntry {
  gateway_transaction_id: number;
  gateway_name: string | null;
  transaction_type: string;
  merchant_request_id: string | null;
  checkout_request_id: string | null;
  account_reference: string | null;
  gateway_amount: number;
  gateway_phone: string | null;
  status: string;
  gateway_response: string | null;
  gateway_created_at: string | null;
  gateway_updated_at: string | null;
  callback_id: number | null;
  callback_type: string | null;
  callback_gateway_name: string | null;
  mpesa_receipt_number: string | null;
  callback_result_code: string | null;
  callback_result_desc: string | null;
  callback_amount: number | null;
  callback_phone: string | null;
  callback_processed: boolean;
  processing_notes: string | null;
  callback_created_at: string | null;
  callback_updated_at: string | null;
}

export interface PaymentAllocationResult {
  payment: FinancePayment;
  allocated_amount: number;
  remaining_amount: number;
  allocations: Array<{
    id: number;
    invoice_id: number;
    amount_allocated: number;
    invoice_number?: string | null;
    invoice_balance?: number | null;
    invoice_status?: InvoiceStatus | null;
  }>;
}

export interface StudentFinanceBalance {
  id: number;
  school_id: number;
  student_id: number;
  currency: string;
  opening_balance: number;
  invoiced_total: number;
  paid_total: number;
  credit_total: number;
  balance: number;
  overdue_balance: number;
  due_soon_balance: number;
  last_updated_at: string | null;
}

export interface FinanceDashboardSummary {
  total_invoiced: number;
  total_collected: number;
  outstanding_balance: number;
  today_collections: number;
  overdue_balance: number;
  due_soon_balance: number;
  collection_rate: number;
}

export interface Book {
  id: number;
  book_id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string;
  publisher: string | null;
  year: number | null;
  total_copies: number;
  available_copies: number;
  rack_no: string | null;
  is_available: boolean;
}

export interface BookIssue {
  id: number;
  book_id: number;
  member_id: number;
  issued_by: number;
  issued_at: string;
  due_date: string;
  returned_at: string | null;
  status: "issued" | "returned" | "lost";
  fine_amount: number;
  is_overdue: boolean;
  days_overdue: number;
  calculated_fine: number;
  book?: Book;
  member?: User;
}

export interface TransportRoute {
  id: number;
  school_id: number;
  name: string;
  vehicle_id: number;
  driver_id: number;
  stops: Array<{ name: string; pickup_time: string; drop_time: string }>;
  monthly_fee: number;
  students_count?: number;
  vehicle?: Vehicle;
  driver?: Driver;
}

export interface Vehicle {
  id: number;
  registration_number: string;
  make: string | null;
  model: string | null;
  year: number | null;
  capacity: number;
  status: "active" | "maintenance" | "inactive";
  last_lat: number | null;
  last_lng: number | null;
  last_speed: number | null;
  location_updated_at: string | null;
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  license_no: string;
  license_expiry: string;
  status: "active" | "inactive";
  is_license_valid: boolean;
}

export interface LiveVehicle {
  vehicle_id: number;
  number: string;
  route: string | null;
  driver: string | null;
  lat: number | null;
  lng: number | null;
  speed: number | null;
  updated_at: string | null;
}

export type EventType = "event" | "exam" | "holiday" | "meeting" | "competition";

export interface SchoolEvent {
  id: number;
  school_id: number;
  created_by: number;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  type: EventType;
  venue: string | null;
  notify_all: boolean;
  is_upcoming: boolean;
  is_ongoing: boolean;
  creator?: User;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  subject: string | null;
  body: string;
  read_at: string | null;
  is_read: boolean;
  sender?: User;
  receiver?: User;
  created_at: string;
}

export interface MessageThread {
  contact: User;
  last_message: Message;
  unread: number;
}

export interface DashboardStats {
  students: number;
  teachers: number;
  fee_collected: number;
  avg_attendance: number;
  upcoming_events: number;
  pending_fees: number;
  low_attendance: number;
}

export interface ActivityItem {
  type: "fee" | "student" | "attendance" | "event";
  icon: string;
  text: string;
  time: string;
  ts: number;
}

export interface DashboardCharts {
  enrollment: Record<string, number>;
  fees: Record<string, number>;
  attendance: Record<string, number>;
}

export interface AnalyticsOverview {
  avg_attendance: number;
  pass_rate: number;
  fee_collection: number;
  teacher_rating: number;
}

// ============================================================
// § 3 — Request payload types
// ============================================================

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface CreateStudentPayload {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  class_id: number;
  blood_group?: string;
  address?: string;
  session_id?: number;
  parent_id?: number;
  status?: "active" | "inactive" | "alumni";
  admission_date?: string;
  religion?: string;
  category?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
}

export type UpdateStudentPayload = Partial<CreateStudentPayload>;

export interface MarkAttendancePayload {
  class_id: number;
  date: string;
  attendance: Array<{
    student_id: number;
    status: AttendanceStatus;
    remarks?: string;
  }>;
}

export interface CreateExamPayload {
  title: string;
  class_id: number;
  subject_id: number;
  exam_date: string;
  start_time: string;
  end_time: string;
  total_marks: number;
  passing_marks: number;
  room?: string;
  invigilator_id?: number;
  instructions?: string;
}

export interface EnterGradesPayload {
  exam_id: number;
  grades: Array<{
    student_id: number;
    marks_obtained: number;
    remarks?: string;
  }>;
}

export interface CollectFeePayload {
  student_id: number;
  fee_type_id: number;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string;
  remarks?: string;
}

export interface IssueBooksPayload {
  member_id: number;
  due_date: string;
}

export interface SendMessagePayload {
  receiver_id: number;
  subject?: string;
  body: string;
}

export interface CreateTeacherPayload {
  name: string;
  email: string;
  phone: string;
  department: string;
  qualification: string;
  experience_yrs: number;
  join_date: string;
  salary?: number;
  subjects?: number[];
}

export type UpdateTeacherPayload = Partial<CreateTeacherPayload> & {
  status?: "active" | "inactive" | "on_leave";
};

export interface CreateClassPayload {
  name: string;
  grade: number;
  section: string;
  class_teacher_id?: number;
  capacity: number;
  room?: string;
  subjects?: number[];
}

export interface UpdateSchoolPayload {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  principal?: string;
  website?: string;
  board?: string;
  affiliation_no?: string;
  established_year?: number;
}

export interface GenerateTimetablePayload {
  class_id: number;
}

export interface AssignTransportPayload {
  student_id: number;
  stop: string;
}

// ============================================================
// § 4 — Query param types
// ============================================================

export interface StudentFilters {
  page?: number;
  per_page?: number;
  search?: string;
  class_id?: number;
  status?: string;
  gender?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  alumni: number;
  fee_overdue: number;
  low_attendance: number;
}

export interface TeacherFilters {
  page?: number;
  per_page?: number;
  search?: string;
  department?: string;
  status?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export interface FeeFilters {
  page?: number;
  per_page?: number;
  student_id?: number;
  fee_type_id?: number;
  status?: FeeStatus;
  method?: PaymentMethod;
  month?: number;
  year?: number;
}

export interface AttendanceFilters {
  class_id?: number;
  date?: string;
  month?: number;
  status?: AttendanceStatus;
  per_page?: number;
}

export interface ExamFilters {
  class_id?: number;
  status?: ExamStatus;
  upcoming?: 1 | 0;
  per_page?: number;
}

export interface BookFilters {
  search?: string;
  category?: string;
  per_page?: number;
}

// ============================================================
// § 5 — HTTP client
// ============================================================

const determineBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // If VITE_API_URL is undefined or hardcoded to localhost, use relative paths to guarantee Vite proxy catches it
  if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
    return "/api/v1";
  }
  return `${envUrl}/api/v1`;
};

const http: AxiosInstance = axios.create({
  baseURL: determineBaseURL(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    // BYPASS NGROK WARNING PAGE: Prevents ngrok from blocking background API calls
    "ngrok-skip-browser-warning": "true",
  },
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

// Attach Bearer token to every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("edunexus_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response handler: unwrap .data, redirect on 401
http.interceptors.response.use(
  (res) => res.data,
  (err: AxiosError<ValidationError>) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("edunexus_token");
      window.location.href = "/login";
    }
    return Promise.reject(err.response?.data ?? err);
  }
);

// Low-level helpers
const get  = <T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) =>
  http.get<never, T>(url, { params, ...config });

const post = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  http.post<never, T>(url, data, config);

const put  = <T>(url: string, data?: unknown) =>
  http.put<never, T>(url, data);

const patch = <T>(url: string, data?: unknown) =>
  http.patch<never, T>(url, data);

const del  = <T>(url: string) =>
  http.delete<never, T>(url);

// Multipart helper for file uploads
const upload = <T>(url: string, formData: FormData) =>
  http.post<never, T>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ============================================================
// § 6 — Auth
// ============================================================

export const auth = {
  login: (payload: LoginPayload) =>
    post<ApiResponse<{ user: User; token: string }>>("/auth/login", payload),

  logout: () =>
    post<ApiResponse<null>>("/auth/logout"),

  me: () =>
    get<ApiResponse<User>>("/auth/me"),

  refresh: () =>
    post<ApiResponse<{ token: string }>>("/auth/refresh"),

  changePassword: (payload: ChangePasswordPayload) =>
    post<ApiResponse<null>>("/auth/change-password", payload),
};

export const sanctum = {
  getCsrfCookie: () =>
    get<ApiResponse<null>>("/sanctum/csrf-cookie", undefined, {
      baseURL: import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes("localhost") 
        ? import.meta.env.VITE_API_URL 
        : "",
    }),
};

// ============================================================
// § 7 — Dashboard
// ============================================================

export const dashboard = {
  stats: () =>
    get<ApiResponse<DashboardStats>>("/dashboard/stats"),

  activity: () =>
    get<ApiResponse<ActivityItem[]>>("/dashboard/activity"),

  charts: () =>
    get<ApiResponse<DashboardCharts>>("/dashboard/charts"),
};

// ============================================================
// § 7b — Academic Sessions
// ============================================================

export const academicSessions = {
  list: () =>
    get<ApiResponse<AcademicSession[]>>("/academic-sessions"),

  get: (id: number) =>
    get<ApiResponse<AcademicSession>>(`/academic-sessions/${id}`),

  create: (payload: { name: string; start_date: string; end_date: string; is_active?: boolean }) =>
    post<ApiResponse<AcademicSession>>("/academic-sessions", payload),

  update: (id: number, payload: Partial<{ name: string; start_date: string; end_date: string; is_active: boolean }>) =>
    put<ApiResponse<AcademicSession>>(`/academic-sessions/${id}`, payload),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/academic-sessions/${id}`),
};

// ============================================================
// § 8 — Students
// ============================================================

export const students = {
  list: (filters?: StudentFilters) =>
    get<PaginatedResponse<Student>>("/students", filters as Record<string, unknown>),

  stats: () =>
    get<ApiResponse<StudentStats>>("/students/stats"),

  get: (id: number) =>
    get<ApiResponse<Student>>(`/students/${id}`),

  create: (payload: CreateStudentPayload) =>
    post<ApiResponse<Student>>("/students", payload),

  createWithPhoto: (payload: CreateStudentPayload & { profile_photo: File }) => {
    const fd = new FormData();
    (Object.entries(payload) as [string, unknown][]).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, v as string | Blob);
    });
    return upload<ApiResponse<Student>>("/students", fd);
  },

  update: (id: number, payload: UpdateStudentPayload) =>
    put<ApiResponse<Student>>(`/students/${id}`, payload),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/students/${id}`),

  import: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return upload<ApiResponse<{ message: string; failures: unknown[] }>>("/students/import", fd);
  },

  reportCard: (id: number) =>
    get<ApiResponse<{
      student: Student;
      grades: Record<string, Grade[]>;
      attendance_percentage: number;
      rank: number | null;
      total_students: number;
    }>>(`/students/${id}/report-card`),

  attendanceHistory: (id: number, params?: { month?: number; year?: number }) =>
    get<ApiResponse<{
      records: Attendance[];
      percentage: number;
      summary: Record<AttendanceStatus, number>;
    }>>(`/students/${id}/attendance`, params as Record<string, unknown>),

  feeHistory: (id: number) =>
    get<ApiResponse<{
      fees: Fee[];
      total_paid: number;
      total_pending: number;
      total_overdue: number;
    }>>(`/students/${id}/fees`),
};

// ============================================================
// § 9 — Teachers
// ============================================================

export const parents = {
  list: (params?: { page?: number; per_page?: number; search?: string }) =>
    get<PaginatedResponse<ParentProfile>>("/parents", params as Record<string, unknown>),

  stats: () =>
    get<ApiResponse<ParentStats>>("/parents/stats"),

  get: (id: number) =>
    get<ApiResponse<ParentProfile>>(`/parents/${id}`),

  me: () =>
    get<ApiResponse<ParentProfile>>("/parents/me"),

  create: (payload: CreateParentPayload) =>
    post<ApiResponse<ParentProfile>>("/parents", payload),

  update: (id: number, payload: UpdateParentPayload) =>
    put<ApiResponse<ParentProfile>>(`/parents/${id}`, payload),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/parents/${id}`),
  
  bulkSms: (payload: { message: string; parent_ids?: number[]; send_to_all?: boolean }) =>
    post<ApiResponse<{ results: Array<Record<string, unknown>> }>>("/sms/bulk", payload),
};

// SMS admin API
export const smsAdmin = {
  logs: (params?: { page?: number; per_page?: number; status?: string; phone?: string }) =>
    get<ApiResponse<any>>('/sms/logs', params as Record<string, unknown>),

  retry: (id: number) =>
    post<ApiResponse<{ message: string }>>(`/sms/retry/${id}`),
};

export const portal = {
  myChildren: () =>
    get<ApiResponse<ParentProfile>>("/parents/me"),

  analytics: () =>
    get<ApiResponse<{
      total_children: number;
      outstanding_children: number;
      total_balance: number;
      children: Array<{
        id: number;
        full_name: string;
        admission_no: string;
        class_name?: string | null;
        balance: number;
      }>;
    }>>("/portal/analytics"),

  studentFinanceSummary: (studentId: number) =>
    get<ApiResponse<{ student_name: string; admission_no: string; balance: string }>>(
      `/portal/students/${studentId}/finance`
    ),

  initiatePayment: (payload: { student_id: number; amount: string; phone_number: string }) =>
    post<ApiResponse<{ message: string }>>( "/portal/payments/mpesa/stk-push", payload ),
};

export const teachers = {
  list: (filters?: TeacherFilters) =>
    get<PaginatedResponse<Teacher>>("/teachers", filters as Record<string, unknown>),

  get: (id: number) =>
    get<ApiResponse<Teacher>>(`/teachers/${id}`),

  create: (payload: CreateTeacherPayload) =>
    post<ApiResponse<Teacher>>("/teachers", payload),

  update: (id: number, payload: UpdateTeacherPayload) =>
    put<ApiResponse<Teacher>>(`/teachers/${id}`, payload),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/teachers/${id}`),

  timetable: (id: number) =>
    get<ApiResponse<Record<string, TimetableSlot[]>>>(`/teachers/${id}/timetable`),

  performance: (id: number) =>
    get<ApiResponse<TeacherPerformance>>(`/teachers/${id}/performance`),
};

// ============================================================
// § 10 — Classes
// ============================================================

export const classes = {
  list: (params?: { per_page?: number }) =>
    get<ApiResponse<ClassRoom[]>>("/classes", params as Record<string, unknown>),

  get: (id: number) =>
    get<ApiResponse<ClassRoom>>(`/classes/${id}`),

  create: (payload: CreateClassPayload) =>
    post<ApiResponse<ClassRoom>>("/classes", payload),

  update: (id: number, payload: Partial<CreateClassPayload>) =>
    put<ApiResponse<ClassRoom>>(`/classes/${id}`, payload),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/classes/${id}`),
};

// ============================================================
// § 11 — Subjects
// ============================================================

export const subjects = {
  list: () =>
    get<ApiResponse<Subject[]>>("/subjects"),

  get: (id: number) =>
    get<ApiResponse<Subject>>(`/subjects/${id}`),

  create: (payload: { name: string; code?: string; type: Subject["type"] }) =>
    post<ApiResponse<Subject>>("/subjects", payload),

  update: (id: number, payload: Partial<{ name: string; code: string; type: Subject["type"] }>) =>
    put<ApiResponse<Subject>>(`/subjects/${id}`, payload),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/subjects/${id}`),
};

// ============================================================
// § 12 — Attendance
// ============================================================

export const attendance = {
  list: (filters?: AttendanceFilters) =>
    get<PaginatedResponse<Attendance>>("/attendance", filters as Record<string, unknown>),

  mark: (payload: MarkAttendancePayload) =>
    post<ApiResponse<{ message: string }>>("/attendance/mark", payload),

  update: (id: number, payload: { status: AttendanceStatus; remarks?: string }) =>
    put<ApiResponse<Attendance>>(`/attendance/${id}`, payload),

  stats: () =>
    get<ApiResponse<AttendanceStats>>("/attendance/stats"),

  low: (threshold?: number) =>
    get<ApiResponse<Array<{ id: number; name: string; class: string; percentage: number; days_absent: number }>>>(
      "/attendance/low",
      threshold ? { threshold } : undefined
    ),

  export: (params: { class_id: number; month: number; year: number }) =>
    get<Blob>("/attendance/export", params as Record<string, unknown>, { responseType: "blob" }),
};

// ============================================================
// § 13 — Timetable
// ============================================================

export const timetable = {
  get: (classId: number) =>
    get<ApiResponse<Record<string, TimetableSlot[]>>>("/timetable", { class_id: classId }),

  store: (payload: Omit<TimetableSlot, "id" | "subject" | "teacher">) =>
    post<ApiResponse<TimetableSlot>>("/timetable", payload),

  update: (slotId: number, payload: Partial<TimetableSlot>) =>
    put<ApiResponse<TimetableSlot>>(`/timetable/${slotId}`, payload),

  generate: (payload: GenerateTimetablePayload) =>
    post<ApiResponse<{ message: string }>>("/timetable/generate", payload),
};

// ============================================================
// § 14 — Exams
// ============================================================

export const exams = {
  list: (filters?: ExamFilters) =>
    get<PaginatedResponse<Exam>>("/exams", filters as Record<string, unknown>),

  stats: () =>
    get<ApiResponse<{ total: number; upcoming: number; ongoing: number; completed: number }>>("/exams/stats"),

   get: (id: number) =>
    get<ApiResponse<Exam>>(`/exams/${id}`),

  create: (payload: CreateExamPayload) =>
    post<ApiResponse<Exam>>("/exams", payload),

  update: (id: number, payload: Partial<CreateExamPayload> & { status?: ExamStatus }) =>
    put<ApiResponse<Exam>>(`/exams/${id}`, payload),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/exams/${id}`),
};

// ============================================================
// § 15 — Grades
// ============================================================

export const grades = {
  enter: (payload: EnterGradesPayload) =>
    post<ApiResponse<{ message: string }>>("/grades", payload),

  distribution: (classId: number) =>
    get<ApiResponse<GradeDistribution[]>>("/grades/distribution", { class_id: classId }),

  subjectPerformance: (classId: number) =>
    get<ApiResponse<Record<string, SubjectPerformance>>>("/grades/subject-perf", { class_id: classId }),
};

// ============================================================
// § 16 — Fees
// ============================================================

export const fees = {
  list: (filters?: FeeFilters) =>
    get<PaginatedResponse<Fee>>("/fees", filters as Record<string, unknown>),

  get: (id: number) =>
    get<ApiResponse<Fee>>(`/fees/${id}`),

  collect: (payload: CollectFeePayload) =>
    post<ApiResponse<Fee> & { receipt_url: string }>("/fees/collect", payload),

  update: (id: number, payload: { status: FeeStatus; remarks?: string }) =>
    put<ApiResponse<Fee>>(`/fees/${id}`, payload),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/fees/${id}`),

  summary: () =>
    get<ApiResponse<FeeSummary>>("/fees/summary"),

  defaulters: (params?: { page?: number; per_page?: number }) =>
    get<PaginatedResponse<Student & { overdue_amount: number }>>("/fees/defaulters", params as Record<string, unknown>),

  receiptUrl: (id: number) =>
    import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes("localhost")
      ? `${import.meta.env.VITE_API_URL}/api/v1/fees/${id}/receipt`
      : `/api/v1/fees/${id}/receipt`,

  export: (filters?: FeeFilters) =>
    get<Blob>("/fees/export", filters as Record<string, unknown>, { responseType: "blob" }),
};

// ============================================================
// § 17 — Fee Types
// ============================================================

export const feeTypes = {
  list: () =>
    get<ApiResponse<FeeType[]>>("/fee-types"),

  create: (payload: Omit<FeeType, "id" | "school_id">) =>
    post<ApiResponse<FeeType>>("/fee-types", payload),

  update: (id: number, payload: Partial<Omit<FeeType, "id" | "school_id">>) =>
    put<ApiResponse<FeeType>>(`/fee-types/${id}`, payload),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/fee-types/${id}`),
};

// ============================================================
// § 18 — Finance Foundation
// ============================================================

export const finance = {
  dashboardSummary: () =>
    get<ApiResponse<FinanceDashboardSummary>>("/finance/dashboard/summary"),

  recentPayments: () =>
    get<ApiResponse<FinancePayment[]>>("/finance/dashboard/recent-payments"),

  feeCategories: (params?: { active?: boolean; page?: number; per_page?: number }) =>
    get<PaginatedResponse<FeeCategory>>("/finance/fee-categories", params as Record<string, unknown>),

  feeCategory: (id: number) =>
    get<ApiResponse<FeeCategory>>(`/finance/fee-categories/${id}`),

  createFeeCategory: (payload: Omit<FeeCategory, "id" | "school_id">) =>
    post<ApiResponse<FeeCategory>>("/finance/fee-categories", payload),

  updateFeeCategory: (id: number, payload: Partial<FeeCategory>) =>
    put<ApiResponse<FeeCategory>>(`/finance/fee-categories/${id}`, payload),

  deleteFeeCategory: (id: number) =>
    del<ApiResponse<null>>(`/finance/fee-categories/${id}`),

  feeStructures: (params?: { class_id?: number; session_id?: number; status?: string; page?: number; per_page?: number }) =>
    get<PaginatedResponse<FeeStructure>>("/finance/fee-structures", params as Record<string, unknown>),

  feeStructure: (id: number) =>
    get<ApiResponse<FeeStructure>>(`/finance/fee-structures/${id}`),

  createFeeStructure: (payload: Omit<FeeStructure, "id" | "school_id" | "items" | "class_room" | "session">) =>
    post<ApiResponse<FeeStructure>>("/finance/fee-structures", payload),

  updateFeeStructure: (id: number, payload: Partial<FeeStructure>) =>
    put<ApiResponse<FeeStructure>>(`/finance/fee-structures/${id}`, payload),

  deleteFeeStructure: (id: number) =>
    del<ApiResponse<null>>(`/finance/fee-structures/${id}`),

  generateInvoices: (payload: { fee_structure_id: number; due_date?: string; student_id?: number }) =>
    post<ApiResponse<{ created: number; invoice_number?: string }>>("/finance/invoices/generate", payload),

  invoices: (filters?: { page?: number; per_page?: number; student_id?: number; class_id?: number; status?: InvoiceStatus }) =>
    get<PaginatedResponse<Invoice>>("/finance/invoices", filters as Record<string, unknown>),

  invoice: (id: number) =>
    get<ApiResponse<Invoice>>(`/finance/invoices/${id}`),

  issueInvoice: (id: number) =>
    post<ApiResponse<Invoice>>(`/finance/invoices/${id}/issue`),

  cancelInvoice: (id: number) =>
    post<ApiResponse<null>>(`/finance/invoices/${id}/cancel`),

  payments: (filters?: { page?: number; per_page?: number; student_id?: number; method?: PaymentMethod; status?: FinancePaymentStatus }) =>
    get<PaginatedResponse<FinancePayment>>("/finance/payments", filters as Record<string, unknown>),

  mpesaStatus: () =>
    get<ApiResponse<MpesaStatusEntry[]>>("/finance/payments/mpesa-status"),

  collectPayment: (payload: {
    student_id: number;
    amount: number;
    payment_method: PaymentMethod;
    payment_channel?: string;
    currency?: string;
    reference_number?: string;
    external_transaction_id?: string;
    payer_name?: string;
    payer_phone?: string;
    auto_allocate?: boolean;
  }) => post<ApiResponse<FinancePayment>>("/finance/payments/collect", payload),

  allocatePayment: (id: number) =>
    post<ApiResponse<FinancePayment>>(`/finance/payments/${id}/allocate`),

  reversePayment: (id: number, reason: string) =>
    post<ApiResponse<FinancePayment>>(`/finance/payments/${id}/reverse`, { reason }),

  paymentReceipt: (id: number) =>
    get<ApiResponse<Receipt>>(`/finance/payments/${id}/receipt`),

  studentSummary: (studentId: number) =>
    get<ApiResponse<StudentFinanceBalance>>(`/students/${studentId}/finance-summary`),

  studentStatement: (studentId: number) =>
    get<ApiResponse<{
      student: Student;
      balance: StudentFinanceBalance;
      overdue_balance: number;
      due_soon_balance: number;
      invoices: Invoice[];
      payments: FinancePayment[];
    }>>(`/students/${studentId}/statement`),

  paymentAllocationResults: (paymentId: number) =>
    get<ApiResponse<PaymentAllocationResult>>(`/finance/payments/${paymentId}/allocation-results`),

  // Receipts
  receipts: (params?: { status?: string; page?: number; per_page?: number }) =>
    get<PaginatedResponse<Receipt>>("/finance/receipts", params as Record<string, unknown>),

  receipt: (id: number) =>
    get<ApiResponse<Receipt>>(`/finance/receipts/${id}`),
};

// ============================================================
// § 18b — Accounting (General Ledger)
// ============================================================

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type NormalBalance = "debit" | "credit";
export type JournalEntryStatus = "draft" | "posted" | "reversed" | "cancelled";

export interface ChartOfAccount {
  id: number;
  school_id: number;
  parent_account_id: number | null;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  currency: string;
  is_control_account: boolean;
  is_bank_account: boolean;
  is_system: boolean;
  is_active: boolean;
  parent?: ChartOfAccount;
  children?: ChartOfAccount[];
}

export interface JournalEntryLine {
  id: number;
  journal_entry_id: number;
  chart_of_account_id: number;
  debit: number;
  credit: number;
  memo: string | null;
  account?: ChartOfAccount;
}

export interface JournalEntry {
  id: number;
  school_id: number;
  entry_date: string;
  description: string;
  reference: string | null;
  source_module: string | null;
  source_id: number | null;
  status: JournalEntryStatus;
  created_by: number;
  creator?: User;
  lines?: JournalEntryLine[];
}

export interface TrialBalanceAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceData {
  accounts: TrialBalanceAccount[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  from_date: string;
  to_date: string;
}

// ============================================================
// § 18b — Accounting API
// ============================================================

export const accounting = {
  accounts: () =>
    get<ApiResponse<ChartOfAccount[]>>("/accounting/accounts"),

  account: (id: number) =>
    get<ApiResponse<ChartOfAccount>>(`/accounting/accounts/${id}`),

  accountTree: () =>
    get<ApiResponse<ChartOfAccount[]>>("/accounting/accounts/tree"),

  accountsByType: (type: AccountType) =>
    get<ApiResponse<ChartOfAccount[]>>(`/accounting/accounts/by-type/${type}`),

  createAccount: (payload: Omit<ChartOfAccount, "id" | "school_id" | "is_system">) =>
    post<ApiResponse<ChartOfAccount>>("/accounting/accounts", payload),

  updateAccount: (id: number, payload: Partial<ChartOfAccount>) =>
    put<ApiResponse<ChartOfAccount>>(`/accounting/accounts/${id}`, payload),

  deleteAccount: (id: number) =>
    del<ApiResponse<null>>(`/accounting/accounts/${id}`),

  journalEntries: () =>
    get<ApiResponse<JournalEntry[]>>("/accounting/journal-entries"),

  journalEntry: (id: number) =>
    get<ApiResponse<JournalEntry>>(`/accounting/journal-entries/${id}`),

  createJournalEntry: (payload: {
    entry_date: string;
    description: string;
    reference?: string;
    source_module?: string;
    source_id?: number;
    lines: Array<{
      chart_of_account_id: number;
      debit: number;
      credit: number;
      memo?: string;
    }>;
  }) => post<ApiResponse<JournalEntry>>("/accounting/journal-entries", payload),

  submitJournalEntry: (id: number) =>
    post<ApiResponse<JournalEntry>>(`/accounting/journal-entries/${id}/submit`),

  approveJournalEntry: (id: number) =>
    post<ApiResponse<JournalEntry>>(`/accounting/journal-entries/${id}/approve`),

  reverseJournalEntry: (id: number, reversal_reason: string) =>
    post<ApiResponse<JournalEntry>>(`/accounting/journal-entries/${id}/reverse`, { reversal_reason }),

  deleteJournalEntry: (id: number) =>
    del<ApiResponse<null>>(`/accounting/journal-entries/${id}`),

  trialBalance: (params?: { from_date?: string; to_date?: string }) =>
    get<ApiResponse<TrialBalanceData>>("/accounting/reports/trial-balance", params as Record<string, unknown>),
};

// ============================================================
// § 19 — Library
// ============================================================

export const library = {
  list: (filters?: BookFilters) =>
    get<PaginatedResponse<Book>>("/books", filters as Record<string, unknown>),

  get: (id: number) =>
    get<ApiResponse<Book>>(`/books/${id}`),

  create: (payload: Omit<Book, "id" | "book_id" | "available_copies" | "is_available">) =>
    post<ApiResponse<Book>>("/books", payload),

  update: (id: number, payload: Partial<Book>) =>
    put<ApiResponse<Book>>(`/books/${id}`, payload),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/books/${id}`),

  issue: (bookId: number, payload: IssueBooksPayload) =>
    post<ApiResponse<{ message: string }>>(`/books/${bookId}/issue`, payload),

  return: (bookId: number, payload: { member_id: number }) =>
    post<ApiResponse<{ message: string; fine: number }>>(`/books/${bookId}/return`, payload),

  overdue: () =>
    get<ApiResponse<Array<{
      id: number;
      book: string;
      member: string;
      due_date: string;
      days_overdue: number;
      fine: number;
    }>>>("/books/overdue"),
};

// ============================================================
// § 19 — Transport
// ============================================================

export const transport = {
  list: () =>
    get<ApiResponse<TransportRoute[]>>("/transport/routes"),

  get: (id: number) =>
    get<ApiResponse<TransportRoute>>(`/transport/routes/${id}`),

  create: (payload: Omit<TransportRoute, "id" | "school_id" | "vehicle" | "driver" | "students_count">) =>
    post<ApiResponse<TransportRoute>>("/transport/routes", payload),

  update: (id: number, payload: Partial<TransportRoute>) =>
    put<ApiResponse<TransportRoute>>(`/transport/routes/${id}`, payload),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/transport/routes/${id}`),

  vehicles: () =>
    get<ApiResponse<Vehicle[]>>("/transport/vehicles"),

  createVehicle: (payload: Omit<Vehicle, "id" | "last_lat" | "last_lng" | "last_speed" | "location_updated_at">) =>
    post<ApiResponse<Vehicle>>("/transport/vehicles", payload),

  drivers: () =>
    get<ApiResponse<Driver[]>>("/transport/drivers"),

  createDriver: (payload: Omit<Driver, "id" | "is_license_valid">) =>
    post<ApiResponse<Driver>>("/transport/drivers", payload),

  live: () =>
    get<ApiResponse<LiveVehicle[]>>("/transport/live"),

  assignStudent: (routeId: number, payload: AssignTransportPayload) =>
    post<ApiResponse<{ message: string }>>(`/transport/routes/${routeId}/assign`, payload),
};

// ============================================================
// § 20 — Events
// ============================================================

export const events = {
  list: (params?: { type?: EventType; upcoming?: 1 | 0; per_page?: number }) =>
    get<PaginatedResponse<SchoolEvent>>("/events", params as Record<string, unknown>),

  get: (id: number) =>
    get<ApiResponse<SchoolEvent>>(`/events/${id}`),

  create: (payload: Omit<SchoolEvent, "id" | "school_id" | "created_by" | "is_upcoming" | "is_ongoing" | "creator">) =>
    post<ApiResponse<SchoolEvent>>("/events", payload),

  update: (id: number, payload: Partial<SchoolEvent>) =>
    put<ApiResponse<SchoolEvent>>(`/events/${id}`, payload),

  delete: (id: number) =>
    del<ApiResponse<null>>(`/events/${id}`),
};

// ============================================================
// § 21 — Messages
// ============================================================

export const messages = {
  threads: () =>
    get<ApiResponse<MessageThread[]>>("/messages"),

  thread: (userId: number) =>
    get<ApiResponse<Message[]>>(`/messages/${userId}`),

  send: (payload: SendMessagePayload) =>
    post<ApiResponse<Message>>("/messages", payload),
};

// ============================================================
// § 22 — Analytics
// ============================================================

export const analytics = {
  overview: () =>
    get<ApiResponse<AnalyticsOverview>>("/analytics/overview"),

  gradePerformance: () =>
    get<ApiResponse<Array<{ class: string; students: number; avg: number }>>>("/analytics/grades"),

  examPerformance: () => get<ApiResponse<any>>("/analytics/exams"),

  attendanceTrend: () =>
    get<ApiResponse<Array<{ month: string; rate: number }>>>("/analytics/attendance"),

  feeAnalytics: () =>
    get<ApiResponse<{
      total_budget?: number;
      total_collected?: number;
      paid?: number;
      pending?: number;
      overdue?: number;
      by_type: Array<{ name: string; amount?: number; collected: number; rate?: number; }>;
      by_month: Array<{ month: string; collected: number }>;
    }>>("/analytics/fees"),

    library: () => 
    get<ApiResponse<{ 
      total_books: number; 
      issued: number; 
      returned_today: number; 
      overdue: number 
    }>>("/analytics/library"),
};


// ============================================================
// § 23 — Settings
// ============================================================

export const settings = {
  get: () =>
    get<ApiResponse<{
      notifications: Record<string, boolean>;
      preferences: Record<string, unknown>;
      academic: Record<string, unknown>;
    }>>("/settings"),

  update: (payload: Record<string, unknown>) =>
    put<ApiResponse<Record<string, unknown>>>("/settings", payload),

  school: () =>
    get<ApiResponse<School>>("/settings/school"),

  updateSchool: (payload: UpdateSchoolPayload | FormData) =>
    payload instanceof FormData
      ? upload<ApiResponse<School>>("/settings/school", payload)
      : put<ApiResponse<School>>("/settings/school", payload),
};

// § 23 — The raw Axios instance (Critical for your existing code)
export const api = axios.create({
  baseURL: determineBaseURL(),
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: true,
});

// Attach the interceptor to the instance
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("edunexus_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// § 24 — Your new grouped object as the DEFAULT export
const apiService = {
  auth,
  dashboard,
  academicSessions,
  students,
  teachers,
  classes,
  subjects,
  attendance,
  timetable,
  exams,
  grades,
  fees,
  feeTypes,
  finance,
  accounting,
  library,
  transport,
  events,
  messages,
  analytics,
  portal,
  settings,
  sanctum,
  parents,
  smsAdmin,
};

export default apiService;