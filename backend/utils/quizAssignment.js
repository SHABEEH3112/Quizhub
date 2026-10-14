const normalize = (value) => String(value ?? "").trim().toLowerCase();

const normalizeSection = (value) =>
  normalize(value).replace(/^section\s+/, "");

const matchesAssignedValue = (assignedValue, studentValue, normalizeValue = normalize) => {
  const assigned = normalizeValue(assignedValue);
  if (!assigned) return true;

  const student = normalizeValue(studentValue);
  return Boolean(student) && assigned === student;
};

const isQuizAssignedToStudent = (quiz, student) => {
  if (
    !matchesAssignedValue(
      quiz.assignedDepartment,
      student.department
    )
  ) {
    return false;
  }

  if (
    !matchesAssignedValue(
      quiz.assignedClassSemester,
      student.className || student.classSemester
    )
  ) {
    return false;
  }

  const assignedSection = quiz.assignedSection || (
    normalize(quiz.studentGroup).startsWith("section ")
      ? quiz.studentGroup
      : ""
  );
  if (!matchesAssignedValue(assignedSection, student.section, normalizeSection)) {
    return false;
  }

  const assignedGroup = normalize(quiz.studentGroup);
  if (assignedGroup && assignedGroup !== "all students" && !assignedGroup.startsWith("section ")) {
    const studentGroup = normalize(student.studentGroup);
    if (studentGroup && assignedGroup !== studentGroup) {
      return false;
    }
  }

  return true;
};

module.exports = { isQuizAssignedToStudent };
