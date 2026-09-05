// ============================================================
// app/lib/validation.ts - Comprehensive form validation
// ============================================================

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validate Student payload
 */
export function validateStudent(data: Record<string, unknown>): ValidationErrors {
  const errors: ValidationErrors = {};

  // Required fields
  if (!data.first_name) errors.first_name = "First name is required.";
  if (!data.last_name) errors.last_name = "Last name is required.";
  if (!data.date_of_birth) errors.date_of_birth = "Date of birth is required.";
  if (!data.gender) errors.gender = "Gender is required.";
  if (!data.class_id) errors.class_id = "Class is required.";

  // Blood group enum
  if (data.blood_group) {
    const validBloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
    if (!validBloodGroups.includes(String(data.blood_group))) {
      errors.blood_group = "Invalid blood group. Must be one of: A+, A-, B+, B-, O+, O-, AB+, AB-.";
    }
  }

  // Status enum
  if (data.status) {
    const validStatuses = ["active", "inactive", "alumni"];
    if (!validStatuses.includes(String(data.status))) {
      errors.status = "Invalid status.";
    }
  }

  // Date of birth validation
  if (data.date_of_birth) {
    const dob = new Date(String(data.date_of_birth));
    if (dob >= new Date()) {
      errors.date_of_birth = "Date of birth must be in the past.";
    }
  }

  // Admission date validation
  if (data.admission_date) {
    const admDate = new Date(String(data.admission_date));
    if (admDate > new Date()) {
      errors.admission_date = "Admission date cannot be in the future.";
    }
  }

  // Conditional parent validation
  const hasParentId = data.parent_id && String(data.parent_id).trim() !== "";
  if (!hasParentId) {
    if (!data.parent_name && !data.parent_email) {
      errors.parent_name = "Either select a parent or provide parent details.";
    }
    if (!data.parent_phone) {
      errors.parent_phone = "Parent phone is required when creating a new parent.";
    }
  }

  // Phone format (basic check)
  if (data.parent_phone && String(data.parent_phone).length < 10) {
    errors.parent_phone = "Parent phone must be at least 10 digits.";
  }

  // Address length
  if (data.address && String(data.address).length > 500) {
    errors.address = "Address must not exceed 500 characters.";
  }

  return errors;
}

/**
 * Validate Teacher payload
 */
export function validateTeacher(data: Record<string, unknown>): ValidationErrors {
  const errors: ValidationErrors = {};

  // Required fields
  if (!data.name) errors.name = "Full name is required.";
  if (!data.email) errors.email = "Email is required.";
  if (!data.phone) errors.phone = "Phone number is required.";
  if (!data.department) errors.department = "Department is required.";
  if (!data.qualification) errors.qualification = "Qualification is required.";
  if (data.experience_yrs === undefined || data.experience_yrs === "") {
    errors.experience_yrs = "Years of experience is required.";
  }


  // Email format
  if (data.email && !String(data.email).includes("@")) {
    errors.email = "Valid email is required.";
  }

  // Phone length
  if (data.phone && String(data.phone).length < 10) {
    errors.phone = "Phone must be at least 10 digits.";
  }

  // Gender enum
  if (data.gender) {
    const validGenders = ["male", "female", "other"];
    if (!validGenders.includes(String(data.gender).toLowerCase())) {
      errors.gender = "Invalid gender.";
    }
  }

  // Date validation
  if (data.dob) {
    const dob = new Date(String(data.dob));
    if (dob >= new Date()) {
      errors.dob = "Date of birth must be in the past.";
    }
  }

  if (data.join_date) {
    const joinDate = new Date(String(data.join_date));
    if (joinDate > new Date()) {
      errors.join_date = "Join date cannot be in the future.";
    }
  }

  // Experience validation
  if (data.experience_yrs !== undefined && data.experience_yrs !== "") {
    const exp = Number(data.experience_yrs);
    if (isNaN(exp) || exp < 0 || exp > 70) {
      errors.experience_yrs = "Experience must be between 0 and 70 years.";
    }
  }

  // Salary validation
  if (data.salary && Number(data.salary) < 0) {
    errors.salary = "Salary cannot be negative.";
  }

  // Status enum
  if (data.status) {
    const validStatuses = ["active", "inactive", "on_leave"];
    if (!validStatuses.includes(String(data.status))) {
      errors.status = "Invalid status.";
    }
  }

  // Password validation
  if (data.password && String(data.password).length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  // Max lengths
  if (data.name && String(data.name).length > 255) {
    errors.name = "Name must not exceed 255 characters.";
  }
  if (data.department && String(data.department).length > 100) {
    errors.department = "Department must not exceed 100 characters.";
  }
  if (data.qualification && String(data.qualification).length > 255) {
    errors.qualification = "Qualification must not exceed 255 characters.";
  }

  return errors;
}

/**
 * Validate Exam payload
 */
export function validateExam(data: Record<string, unknown>): ValidationErrors {
  const errors: ValidationErrors = {};

  // Required fields
  if (!data.title) errors.title = "Exam title is required.";
  if (!data.class_id) errors.class_id = "Class is required.";
  if (!data.subject_id) errors.subject_id = "Subject is required.";
  if (!data.exam_date) errors.exam_date = "Exam date is required.";
  if (!data.start_time) errors.start_time = "Start time is required.";
  if (!data.end_time) errors.end_time = "End time is required.";
  if (data.total_marks === undefined || data.total_marks === "") {
    errors.total_marks = "Total marks is required.";
  }
  if (data.passing_marks === undefined || data.passing_marks === "") {
    errors.passing_marks = "Passing marks is required.";
  }

  // Exam date validation (must be after today)
  if (data.exam_date) {
    const examDate = new Date(String(data.exam_date));
    if (examDate <= new Date()) {
      errors.exam_date = "Exam date must be in the future.";
    }
  }

  // Time validation
  if (data.start_time && data.end_time) {
    if (String(data.start_time) >= String(data.end_time)) {
      errors.end_time = "End time must be after start time.";
    }
  }

  // Marks validation
  if (data.total_marks !== undefined) {
    const total = Number(data.total_marks);
    if (isNaN(total) || total < 1) {
      errors.total_marks = "Total marks must be at least 1.";
    }
  }

  if (data.passing_marks !== undefined && data.total_marks !== undefined) {
    const passing = Number(data.passing_marks);
    const total = Number(data.total_marks);
    if (passing >= total) {
      errors.passing_marks = "Passing marks must be less than total marks.";
    }
  }

  // Status enum
  if (data.status) {
    const validStatuses = ["scheduled", "ongoing", "completed", "cancelled"];
    if (!validStatuses.includes(String(data.status))) {
      errors.status = "Invalid status.";
    }
  }

  // Max lengths
  if (data.title && String(data.title).length > 255) {
    errors.title = "Title must not exceed 255 characters.";
  }

  return errors;
}

/**
 * Validate ClassRoom payload
 */
export function validateClassRoom(data: Record<string, unknown>): ValidationErrors {
  const errors: ValidationErrors = {};

  // Required fields
  if (!data.name) errors.name = "Class name is required.";
  if (!data.grade && data.grade !== 0) errors.grade = "Grade is required.";
  if (!data.section) errors.section = "Section is required.";
  if (!data.capacity && data.capacity !== 0) errors.capacity = "Capacity is required.";

  // Grade range validation (1-12)
  if (data.grade !== undefined && data.grade !== "") {
    const grade = Number(data.grade);
    if (isNaN(grade) || grade < 1 || grade > 12) {
      errors.grade = "Grade must be between 1 and 12.";
    }
  }

  // Capacity validation
  if (data.capacity !== undefined && data.capacity !== "") {
    const cap = Number(data.capacity);
    if (isNaN(cap) || cap < 1) {
      errors.capacity = "Capacity must be at least 1.";
    }
  }

  // Max lengths
  if (data.name && String(data.name).length > 50) {
    errors.name = "Class name must not exceed 50 characters.";
  }
  if (data.section && String(data.section).length > 5) {
    errors.section = "Section must not exceed 5 characters.";
  }
  if (data.room && String(data.room).length > 50) {
    errors.room = "Room number must not exceed 50 characters.";
  }

  return errors;
}

/**
 * Validate Parent payload
 */
export function validateParent(data: Record<string, unknown>): ValidationErrors {
  const errors: ValidationErrors = {};

  // Required fields
  if (!data.name) errors.name = "Name is required.";

  // Email format
  if (data.email && !String(data.email).includes("@")) {
    errors.email = "Valid email is required.";
  }

  // Phone length
  if (data.phone && String(data.phone).length < 10) {
    errors.phone = "Phone must be at least 10 digits.";
  }

  if (data.whatsapp_phone && String(data.whatsapp_phone).length < 10) {
    errors.whatsapp_phone = "WhatsApp phone must be at least 10 digits.";
  }

  // Max lengths
  if (data.name && String(data.name).length > 255) {
    errors.name = "Name must not exceed 255 characters.";
  }
  if (data.address && String(data.address).length > 500) {
    errors.address = "Address must not exceed 500 characters.";
  }
  if (data.occupation && String(data.occupation).length > 100) {
    errors.occupation = "Occupation must not exceed 100 characters.";
  }

  return errors;
}
