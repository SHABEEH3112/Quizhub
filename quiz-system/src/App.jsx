import { useEffect, useRef, useState } from "react";
import { API } from "./services/api";

function App() {
  const [page, setPage] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerRole, setRegisterRole] = useState("student");
  const [registerRollNumber, setRegisterRollNumber] = useState("");

  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);

  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const verificationStarted = useRef(false);
  const passwordResetStarted = useRef(false);

  const [quizzes, setQuizzes] = useState([]);
  const [quizSearch, setQuizSearch] = useState("");
  const [quizSubjectFilter, setQuizSubjectFilter] = useState("All Subjects");
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizSessionToken, setQuizSessionToken] = useState("");

  const emptyQuestion = () => ({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    marks: 1,
  });

  // Create Quiz state
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizSubject, setNewQuizSubject] = useState("");
  const [newQuizDepartment, setNewQuizDepartment] = useState("");
  const [newQuizClassSemester, setNewQuizClassSemester] = useState("");
  const [newQuizDescription, setNewQuizDescription] = useState("");

  const [newQuizTimeLimit, setNewQuizTimeLimit] = useState(30);
  const [newQuizTotalMarks, setNewQuizTotalMarks] = useState(0);
  const [newQuizPassingMarks, setNewQuizPassingMarks] = useState(0);

  const [newQuizNumberOfAttempts, setNewQuizNumberOfAttempts] = useState(1);
  const [newQuizRandomizeQuestions, setNewQuizRandomizeQuestions] = useState(false);
  const [newQuizRandomizeOptions, setNewQuizRandomizeOptions] = useState(false);
  const [newQuizShowResultImmediately, setNewQuizShowResultImmediately] = useState(true);

  const [newQuizStartDateTime, setNewQuizStartDateTime] = useState("");
  const [newQuizEndDateTime, setNewQuizEndDateTime] = useState("");

  const [newQuizAssignedDepartment, setNewQuizAssignedDepartment] = useState("");
  const [newQuizAssignedClassSemester, setNewQuizAssignedClassSemester] = useState("");
  const [newQuizStudentGroup, setNewQuizStudentGroup] = useState("All Students");
  const [newQuizStatus, setNewQuizStatus] = useState("published");

  const [newQuizQuestions, setNewQuizQuestions] = useState([emptyQuestion()]);
  const [teacherQuizzes, setTeacherQuizzes] = useState([]);
  const [loadingTeacherQuizzes, setLoadingTeacherQuizzes] = useState(false);

  const [teacherResults, setTeacherResults] = useState([]);
  const [loadingTeacherResults, setLoadingTeacherResults] = useState(false);

  // Edit quiz state
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [editQuizTitle, setEditQuizTitle] = useState("");
  const [editQuizSubject, setEditQuizSubject] = useState("");
  const [editQuizDepartment, setEditQuizDepartment] = useState("");
  const [editQuizClassSemester, setEditQuizClassSemester] = useState("");
  const [editQuizDescription, setEditQuizDescription] = useState("");
  const [editQuizTimeLimit, setEditQuizTimeLimit] = useState(30);
  const [editQuizTotalMarks, setEditQuizTotalMarks] = useState(0);
  const [editQuizPassingMarks, setEditQuizPassingMarks] = useState(0);
  const [editQuizNumberOfAttempts, setEditQuizNumberOfAttempts] = useState(1);
  const [editQuizRandomizeQuestions, setEditQuizRandomizeQuestions] = useState(false);
  const [editQuizRandomizeOptions, setEditQuizRandomizeOptions] = useState(false);
  const [editQuizShowResultImmediately, setEditQuizShowResultImmediately] = useState(true);
  const [editQuizStartDateTime, setEditQuizStartDateTime] = useState("");
  const [editQuizEndDateTime, setEditQuizEndDateTime] = useState("");
  const [editQuizAssignedDepartment, setEditQuizAssignedDepartment] = useState("");
  const [editQuizAssignedClassSemester, setEditQuizAssignedClassSemester] = useState("");
  const [editQuizStudentGroup, setEditQuizStudentGroup] = useState("All Students");
  const [editQuizStatus, setEditQuizStatus] = useState("published");
  const [editQuizQuestions, setEditQuizQuestions] = useState([]);

  const clearMessage = () => setMessage("");

  // Load locally saved profile display data.
  useEffect(() => {
    try {
      const savedName = localStorage.getItem("profileDisplayName") || "";
      const savedPicture = localStorage.getItem("profilePicture") || "";
      setDisplayName(savedName);
      setProfilePicture(savedPicture);
    } catch {
      // Ignore localStorage errors and keep the normal profile flow working.
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetTokenFromUrl = params.get("reset");

    if (resetTokenFromUrl && !passwordResetStarted.current) {
      passwordResetStarted.current = true;
      setResetToken(resetTokenFromUrl);
      setPage("reset");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const token = params.get("verify");

    if (!token || verificationStarted.current) return;
    verificationStarted.current = true;
    setPage("verifyingEmail");

    fetch(`${API}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Email confirm nahi ho saki.");
        }
        setMessage(data.message || "Email confirm ho gayi. Ab login karein.");
      })
      .catch((error) => {
        setMessage(error.message || "Email confirm nahi ho saki. Dobara try karein.");
      })
      .finally(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        setPage("login");
      });
  }, []);

  const shownName = displayName.trim() || user?.name || "Student";

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Sirf image file select karein.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Profile picture 2 MB se chhoti honi chahiye.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      setProfilePicture(value);
      try {
        localStorage.setItem("profilePicture", value);
        setMessage("Profile picture select ho gayi. Ab Update Profile dabayein.");
      } catch {
        setMessage("Picture save nahi ho saki. Browser storage check karein.");
      }
    };
    reader.onerror = () => setMessage("Profile picture read nahi ho saki.");
    reader.readAsDataURL(file);
  };


  const handleGlobalSearch = async () => {
    clearMessage();
    setPage("quizList");

    // Search dashboard se press karne par quizzes available hon to unhein
    // pehle load kar dein; existing search text phir automatically filter hoga.
    if (quizzes.length === 0) {
      await handleStartQuiz();
    }
  };

  const goToDashboard = () => {
    clearMessage();
    setSelectedQuiz(null);
    setQuizSessionToken("");
    setAnswers([]);
    setCurrentQuestion(0);
    setTimeLeft(0);
    setQuizResult(null);
    setPage("dashboard");
  };


  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("Login ho raha hai...");

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      setUser(data.user);
      setMessage("");

      if (data.user?.role === "teacher") {
        try {
          const profileResponse = await fetch(
            `${API}/api/profile?token=${data.token}`
          );
          const profileData = await profileResponse.json();

          if (profileResponse.ok && profileData.profile) {
            const teacherProfile = profileData.profile;
            setProfile(teacherProfile);
            setDisplayName(teacherProfile.name || data.user.name || "");
            setProfilePicture(teacherProfile.profilePicture || "");
            setTeacherId(teacherProfile.teacherId || "");
            setUser((current) => current ? { ...current, ...teacherProfile } : current);
          }
        } catch {
          // Keep teacher login available if optional profile loading fails.
        }

        setPage("teacherDashboard");
        return;
      }

      try {
        const profileResponse = await fetch(
          `${API}/api/profile?token=${data.token}`
        );
        const profileData = await profileResponse.json();

        if (profileResponse.ok && profileData.profile) {
          setProfile(profileData.profile);
          setClassName(profileData.profile.className || "");
          setSection(profileData.profile.section || "");
          setRollNumber(profileData.profile.rollNumber || "");
          setSubject(profileData.profile.subject || "");
          const profileStudent = profileData.profile?.student || profileData.profile || {};
          const loadedName = profileStudent.name || data.user?.name || localStorage.getItem("profileDisplayName") || "Student";
          const loadedPicture = profileStudent.profilePicture || localStorage.getItem("profilePicture") || "";
          setDisplayName(loadedName);
          setProfilePicture(loadedPicture);
          setUser((current) => current ? { ...current, name: loadedName, rollNumber: profileStudent.rollNumber || current.rollNumber || "" } : current);
          setPage("dashboard");
        } else {
          setPage("profile");
        }
      } catch {
        setPage("profile");
      }
    } catch {
      setMessage("Backend se connection nahi ho raha.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setMessage("Registration ho rahi hai...");

    try {
      const response = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: registerRole,
          rollNumber: registerRole === "student" ? registerRollNumber.trim() : "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed.");
        return;
      }

      setMessage(
        ""
      );
      setVerificationEmail(email.trim().toLowerCase());
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRegisterRole("student");
      setRegisterRollNumber("");
      setPage("verificationPending");
    } catch {
      setMessage("Backend se connection nahi ho raha.");
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      setPage("login");
      return;
    }

    setMessage("Profile save ho raha hai...");

    try {
      const response = await fetch(`${API}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: displayName.trim() || user?.name || "",
          className,
          section,
          rollNumber,
          subject,
          profilePicture,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Profile create nahi hua.");
        return;
      }

      setProfile(data.profile);
      const createdStudent = data.profile?.student || data.profile || {};
      const createdName = createdStudent.name || displayName.trim() || user?.name || "Student";
      const createdPicture = createdStudent.profilePicture || profilePicture || "";
      setDisplayName(createdName);
      setProfilePicture(createdPicture);
      setUser((current) => current ? { ...current, name: createdName, rollNumber: createdStudent.rollNumber || rollNumber } : current);
      try {
        localStorage.setItem("profileDisplayName", createdName);
        if (createdPicture) localStorage.setItem("profilePicture", createdPicture);
      } catch {}
      setMessage("Profile successfully create ho gaya!");
      setPage("dashboard");
    } catch {
      setMessage("Profile create karte waqt error aa gaya.");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      setPage("login");
      return;
    }

    setMessage("Profile update ho raha hai...");

    try {
      const profileUpdate = {
        token,
        name: displayName.trim() || user?.name || "",
        profilePicture,
      };

      if (isTeacher) {
        profileUpdate.teacherId = teacherId.trim();
      } else {
        Object.assign(profileUpdate, { className, section, rollNumber, subject });
      }

      const response = await fetch(`${API}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileUpdate),
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.log("PROFILE UPDATE RESPONSE PARSE ERROR:", parseError);
      }

      if (!response.ok) {
        setMessage(data.message || "Profile update nahi hua.");
        return;
      }

      setProfile(data.profile);
      const updatedStudent = data.profile?.student || data.profile || {};
      const updatedName = updatedStudent.name || displayName.trim() || user?.name || "Student";
      const updatedPicture = updatedStudent.profilePicture || profilePicture || "";
      const updatedTeacherId = updatedStudent.teacherId ?? teacherId;
      setDisplayName(updatedName);
      setProfilePicture(updatedPicture);
      setTeacherId(updatedTeacherId);
      setUser((current) => current ? { ...current, name: updatedName, teacherId: updatedTeacherId, rollNumber: updatedStudent.rollNumber || rollNumber } : current);
      try {
        localStorage.setItem("profileDisplayName", updatedName);
        if (updatedPicture) localStorage.setItem("profilePicture", updatedPicture);
        else localStorage.removeItem("profilePicture");
      } catch {}
      setMessage("Profile successfully update ho gaya!");
      setPage(isTeacher ? "teacherDashboard" : "dashboard");
    } catch {
      setMessage("Profile update karte waqt error aa gaya.");
    }
  };

  const resetQuizForm = () => {
    setNewQuizTitle("");
    setNewQuizSubject("");
    setNewQuizDepartment("");
    setNewQuizClassSemester("");
    setNewQuizDescription("");

    setNewQuizTimeLimit(30);
    setNewQuizTotalMarks(0);
    setNewQuizPassingMarks(0);

    setNewQuizNumberOfAttempts(1);
    setNewQuizRandomizeQuestions(false);
    setNewQuizRandomizeOptions(false);
    setNewQuizShowResultImmediately(true);

    setNewQuizStartDateTime("");
    setNewQuizEndDateTime("");

    setNewQuizAssignedDepartment("");
    setNewQuizAssignedClassSemester("");
    setNewQuizStudentGroup("All Students");
    setNewQuizStatus("published");

    setNewQuizQuestions([emptyQuestion()]);
  };

  const updateQuestionField = (questionIndex, field, value) => {
    setNewQuizQuestions((current) =>
      current.map((item, index) =>
        index === questionIndex ? { ...item, [field]: value } : item
      )
    );
  };

  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    setNewQuizQuestions((current) =>
      current.map((item, index) => {
        if (index !== questionIndex) return item;
        const options = [...item.options];
        options[optionIndex] = value;
        return { ...item, options };
      })
    );
  };

  const addQuestion = () => {
    setNewQuizQuestions((current) => [...current, emptyQuestion()]);
  };

  const updateQuestionMarks = (questionIndex, value) => {
    setNewQuizQuestions((current) =>
      current.map((item, index) =>
        index === questionIndex
          ? { ...item, marks: Math.max(1, Number(value) || 1) }
          : item
      )
    );
  };


  const removeQuestion = (questionIndex) => {
    if (newQuizQuestions.length === 1) {
      setMessage("Kam az kam 1 question zaroor hona chahiye.");
      return;
    }

    setNewQuizQuestions((current) =>
      current.filter((_, index) => index !== questionIndex)
    );
  };

  const handleCreateQuiz = async (e, forcedStatus = null) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setPage("login");
      return;
    }

    const statusToSave = forcedStatus || newQuizStatus;

    if (!newQuizTitle.trim()) {
      setMessage("Quiz title enter karein.");
      return;
    }

    if (!Number.isFinite(Number(newQuizTimeLimit)) || Number(newQuizTimeLimit) < 1) {
      setMessage("Time limit kam az kam 1 minute honi chahiye.");
      return;
    }

    if (!Number.isFinite(Number(newQuizNumberOfAttempts)) || Number(newQuizNumberOfAttempts) < 1) {
      setMessage("Number of attempts kam az kam 1 hona chahiye.");
      return;
    }

    if (newQuizQuestions.length === 0) {
      setMessage("Kam az kam 1 question hona chahiye.");
      return;
    }

    let calculatedTotalMarks = 0;

    for (let i = 0; i < newQuizQuestions.length; i++) {
      const item = newQuizQuestions[i];
      const marks = Math.max(1, Number(item.marks) || 1);
      calculatedTotalMarks += marks;

      if (
        !item.question.trim() ||
        !Array.isArray(item.options) ||
        item.options.length !== 4 ||
        item.options.some((option) => !option.trim())
      ) {
        setMessage(`Question ${i + 1} aur uski 4 options complete karein.`);
        return;
      }

      const correctAnswer = String(item.correctAnswer || "").trim();

      if (!correctAnswer) {
        setMessage(`Question ${i + 1} ka correct answer select karein.`);
        return;
      }

      if (!item.options.some((option) => option.trim() === correctAnswer)) {
        setMessage(`Question ${i + 1} ka correct answer options mein mojood nahi hai.`);
        return;
      }

      if (!Number.isFinite(Number(item.marks)) || Number(item.marks) < 1) {
        setMessage(`Question ${i + 1} ke marks kam az kam 1 hone chahiye.`);
        return;
      }
    }

    const totalMarks =
      Number(newQuizTotalMarks) > 0
        ? Number(newQuizTotalMarks)
        : calculatedTotalMarks;

    const passingMarks = Number(newQuizPassingMarks) || 0;

    if (passingMarks > totalMarks) {
      setMessage("Passing marks total marks se zyada nahi ho sakte.");
      return;
    }

    if (newQuizStartDateTime && newQuizEndDateTime) {
      const start = new Date(newQuizStartDateTime);
      const end = new Date(newQuizEndDateTime);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        setMessage("Start/End date time valid nahi hai.");
        return;
      }

      if (end <= start) {
        setMessage("End date/time start date/time ke baad hona chahiye.");
        return;
      }
    }

    setMessage(
      statusToSave === "draft"
        ? "Quiz draft save ho raha hai..."
        : "Quiz publish ho raha hai..."
    );

    try {
      const response = await fetch(`${API}/api/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          title: newQuizTitle.trim(),
          subject: newQuizSubject.trim(),
          department: newQuizDepartment.trim(),
          classSemester: newQuizClassSemester.trim(),
          description: newQuizDescription.trim(),
          timeLimit: Number(newQuizTimeLimit),
          totalMarks,
          passingMarks,
          numberOfAttempts: Number(newQuizNumberOfAttempts),
          randomizeQuestions: Boolean(newQuizRandomizeQuestions),
          randomizeOptions: Boolean(newQuizRandomizeOptions),
          showResultImmediately: Boolean(newQuizShowResultImmediately),
          startDateTime: newQuizStartDateTime
            ? new Date(newQuizStartDateTime).toISOString()
            : null,
          endDateTime: newQuizEndDateTime
            ? new Date(newQuizEndDateTime).toISOString()
            : null,
          assignedDepartment: newQuizAssignedDepartment.trim(),
          assignedClassSemester: newQuizAssignedClassSemester.trim(),
          studentGroup: newQuizStudentGroup.trim() || "All Students",
          status: statusToSave,
          questions: newQuizQuestions.map((item) => ({
            question: item.question.trim(),
            options: item.options.map((option) => option.trim()),
            correctAnswer: String(item.correctAnswer || "").trim(),
            marks: Math.max(1, Number(item.marks) || 1),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Quiz create nahi hua.");
        return;
      }

      resetQuizForm();
      await loadTeacherQuizzes();
      setPage("manageQuizzes");

      setMessage(
        statusToSave === "draft"
          ? "📝 Quiz draft successfully save ho gaya!"
          : "🎉 Quiz successfully publish ho gaya!"
      );
    } catch (error) {
      console.log("CREATE QUIZ ERROR:", error);
      setMessage("Quiz create karte waqt server error aa gaya.");
    }
  };


  const loadTeacherQuizzes = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setPage("login");
      return;
    }

    setLoadingTeacherQuizzes(true);

    try {
      const response = await fetch(
        `${API}/api/quizzes/teacher/my-quizzes?token=${encodeURIComponent(token)}`
      );
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Teacher quizzes load nahi huay.");
        setLoadingTeacherQuizzes(false);
        return;
      }

      setTeacherQuizzes(data);
      setMessage("");
    } catch {
      setMessage("Teacher quizzes load karte waqt error aa gaya.");
    }

    setLoadingTeacherQuizzes(false);
  };

  const loadTeacherResults = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setPage("login");
      return;
    }

    setLoadingTeacherResults(true);
    setMessage("Results load ho rahe hain...");

    try {
      const response = await fetch(
        `${API}/api/attempts/teacher/results?token=${encodeURIComponent(token)}`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Results load nahi huay.");
        return;
      }

      setTeacherResults(data.attempts || []);
      setMessage("");
      setPage("teacherResults");
    } catch {
      setMessage("Results load karte waqt server error aa gaya.");
    } finally {
      setLoadingTeacherResults(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setPage("login");
      return;
    }

    setMessage("Quiz delete ho raha hai...");

    try {
      const response = await fetch(`${API}/api/quizzes/${quizId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Quiz delete nahi hua.");
        return;
      }

      setTeacherQuizzes((current) =>
        current.filter((quiz) => quiz._id !== quizId)
      );
      setMessage("Quiz successfully delete ho gaya.");
    } catch {
      setMessage("Quiz delete karte waqt server error aa gaya.");
    }
  };

  const startEditQuiz = (quiz) => {
    setEditingQuizId(quiz._id);

    setEditQuizTitle(quiz.title || "");
    setEditQuizSubject(quiz.subject || "");
    setEditQuizDepartment(quiz.department || "");
    setEditQuizClassSemester(quiz.classSemester || "");
    setEditQuizDescription(quiz.description || "");

    setEditQuizTimeLimit(Number(quiz.timeLimit) || 30);
    setEditQuizTotalMarks(Number(quiz.totalMarks) || 0);
    setEditQuizPassingMarks(Number(quiz.passingMarks) || 0);

    setEditQuizNumberOfAttempts(Number(quiz.numberOfAttempts) || 1);
    setEditQuizRandomizeQuestions(Boolean(quiz.randomizeQuestions));
    setEditQuizRandomizeOptions(Boolean(quiz.randomizeOptions));
    setEditQuizShowResultImmediately(
      quiz.showResultImmediately === undefined
        ? true
        : Boolean(quiz.showResultImmediately)
    );

    setEditQuizStartDateTime(
      quiz.startDateTime
        ? new Date(quiz.startDateTime).toISOString().slice(0, 16)
        : ""
    );
    setEditQuizEndDateTime(
      quiz.endDateTime
        ? new Date(quiz.endDateTime).toISOString().slice(0, 16)
        : ""
    );

    setEditQuizAssignedDepartment(quiz.assignedDepartment || "");
    setEditQuizAssignedClassSemester(quiz.assignedClassSemester || "");
    setEditQuizStudentGroup(quiz.studentGroup || "All Students");
    setEditQuizStatus(quiz.status || "published");

    setEditQuizQuestions(
      (quiz.questions || []).map((item) => ({
        question: item.question || "",
        options: [
          ...(item.options || ["", "", "", ""]),
        ].slice(0, 4),
        correctAnswer: item.correctAnswer || "",
        marks: Math.max(1, Number(item.marks) || 1),
      }))
    );

    setMessage("");
    setPage("editQuiz");
  };


  const updateEditQuestionField = (questionIndex, field, value) => {
    setEditQuizQuestions((current) =>
      current.map((item, index) =>
        index === questionIndex ? { ...item, [field]: value } : item
      )
    );
  };

  const updateEditQuestionOption = (questionIndex, optionIndex, value) => {
    setEditQuizQuestions((current) =>
      current.map((item, index) => {
        if (index !== questionIndex) return item;

        const options = [...item.options];
        const oldValue = options[optionIndex];
        options[optionIndex] = value;

        return {
          ...item,
          options,
          correctAnswer:
            item.correctAnswer === oldValue ? value : item.correctAnswer,
        };
      })
    );
  };

  const addEditQuestion = () => {
    setEditQuizQuestions((current) => [...current, emptyQuestion()]);
  };

  const updateEditQuestionMarks = (questionIndex, value) => {
    setEditQuizQuestions((current) =>
      current.map((item, index) =>
        index === questionIndex
          ? { ...item, marks: Math.max(1, Number(value) || 1) }
          : item
      )
    );
  };


  const removeEditQuestion = (questionIndex) => {
    if (editQuizQuestions.length === 1) {
      setMessage("Kam az kam 1 question zaroor hona chahiye.");
      return;
    }

    setEditQuizQuestions((current) =>
      current.filter((_, index) => index !== questionIndex)
    );
  };

  const handleUpdateQuiz = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setPage("login");
      return;
    }

    if (!editingQuizId) {
      setMessage("Quiz select nahi hua.");
      return;
    }

    if (!editQuizTitle.trim()) {
      setMessage("Quiz title enter karein.");
      return;
    }

    if (!Number.isFinite(Number(editQuizTimeLimit)) || Number(editQuizTimeLimit) < 1) {
      setMessage("Time limit kam az kam 1 minute honi chahiye.");
      return;
    }

    if (!Number.isFinite(Number(editQuizNumberOfAttempts)) || Number(editQuizNumberOfAttempts) < 1) {
      setMessage("Number of attempts kam az kam 1 hona chahiye.");
      return;
    }

    if (editQuizQuestions.length === 0) {
      setMessage("Kam az kam 1 question hona chahiye.");
      return;
    }

    let calculatedTotalMarks = 0;

    for (let i = 0; i < editQuizQuestions.length; i++) {
      const item = editQuizQuestions[i];
      const marks = Math.max(1, Number(item.marks) || 1);
      calculatedTotalMarks += marks;

      if (
        !item.question.trim() ||
        item.options.length !== 4 ||
        item.options.some((option) => !option.trim())
      ) {
        setMessage(`Question ${i + 1} aur uski 4 options complete karein.`);
        return;
      }

      const correctAnswer = String(item.correctAnswer || "").trim();

      if (!correctAnswer) {
        setMessage(`Question ${i + 1} ka correct answer select karein.`);
        return;
      }

      if (!item.options.some((option) => option.trim() === correctAnswer)) {
        setMessage(`Question ${i + 1} ka correct answer options mein mojood nahi hai.`);
        return;
      }

      if (!Number.isFinite(Number(item.marks)) || Number(item.marks) < 1) {
        setMessage(`Question ${i + 1} ke marks kam az kam 1 hone chahiye.`);
        return;
      }
    }

    const totalMarks =
      Number(editQuizTotalMarks) > 0
        ? Number(editQuizTotalMarks)
        : calculatedTotalMarks;

    const passingMarks = Number(editQuizPassingMarks) || 0;

    if (passingMarks > totalMarks) {
      setMessage("Passing marks total marks se zyada nahi ho sakte.");
      return;
    }

    if (editQuizStartDateTime && editQuizEndDateTime) {
      const start = new Date(editQuizStartDateTime);
      const end = new Date(editQuizEndDateTime);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        setMessage("Start/End date time valid nahi hai.");
        return;
      }

      if (end <= start) {
        setMessage("End date/time start date/time ke baad hona chahiye.");
        return;
      }
    }

    setMessage("Quiz update ho raha hai...");

    try {
      const response = await fetch(`${API}/api/quizzes/${editingQuizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          title: editQuizTitle.trim(),
          subject: editQuizSubject.trim(),
          department: editQuizDepartment.trim(),
          classSemester: editQuizClassSemester.trim(),
          description: editQuizDescription.trim(),
          timeLimit: Number(editQuizTimeLimit),
          totalMarks,
          passingMarks,
          numberOfAttempts: Number(editQuizNumberOfAttempts),
          randomizeQuestions: Boolean(editQuizRandomizeQuestions),
          randomizeOptions: Boolean(editQuizRandomizeOptions),
          showResultImmediately: Boolean(editQuizShowResultImmediately),
          startDateTime: editQuizStartDateTime
            ? new Date(editQuizStartDateTime).toISOString()
            : null,
          endDateTime: editQuizEndDateTime
            ? new Date(editQuizEndDateTime).toISOString()
            : null,
          assignedDepartment: editQuizAssignedDepartment.trim(),
          assignedClassSemester: editQuizAssignedClassSemester.trim(),
          studentGroup: editQuizStudentGroup.trim() || "All Students",
          status: editQuizStatus,
          questions: editQuizQuestions.map((item) => ({
            question: item.question.trim(),
            options: item.options.map((option) => option.trim()),
            correctAnswer: String(item.correctAnswer || "").trim(),
            marks: Math.max(1, Number(item.marks) || 1),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Quiz update nahi hua.");
        return;
      }

      setEditingQuizId(null);
      setEditQuizTitle("");
      setEditQuizSubject("");
      setEditQuizDepartment("");
      setEditQuizClassSemester("");
      setEditQuizDescription("");
      setEditQuizTimeLimit(30);
      setEditQuizTotalMarks(0);
      setEditQuizPassingMarks(0);
      setEditQuizNumberOfAttempts(1);
      setEditQuizRandomizeQuestions(false);
      setEditQuizRandomizeOptions(false);
      setEditQuizShowResultImmediately(true);
      setEditQuizStartDateTime("");
      setEditQuizEndDateTime("");
      setEditQuizAssignedDepartment("");
      setEditQuizAssignedClassSemester("");
      setEditQuizStudentGroup("All Students");
      setEditQuizStatus("published");
      setEditQuizQuestions([]);

      await loadTeacherQuizzes();
      setPage("manageQuizzes");
      setMessage("🎉 Quiz successfully update ho gaya!");
    } catch (error) {
      console.log("UPDATE QUIZ ERROR:", error);
      setMessage("Quiz update karte waqt server error aa gaya.");
    }
  };


  const handleStartQuiz = async () => {
    setMessage("Quizzes load ho rahe hain...");

    try {
      const response = await fetch(`${API}/api/quizzes`);
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Quizzes load nahi huay.");
        return;
      }

      setQuizzes(data.quizzes || data);
      setMessage("");
      setPage("quizList");
    } catch {
      setMessage("Quizzes load nahi ho rahe. Backend check karo.");
    }
  };

  const handleOpenQuiz = async (quiz) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Login session expire ho gaya. Dobara login karein.");
      setPage("login");
      return;
    }

    setMessage("Quiz start ho raha hai...");

    try {
      const response = await fetch(`${API}/api/attempts/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          quizId: quiz._id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Quiz start nahi hua.");
        return;
      }

      setQuizSessionToken(data.quizSessionToken);
      setTimeLeft(
        Number(data.timeLimitSeconds) ||
        (Number(quiz.timeLimit) || 30) * 60
      );

      // Backend /start response is authoritative for randomized questions/options.
      const startedQuiz = {
        ...quiz,
        questions: Array.isArray(data.questions) && data.questions.length
          ? data.questions
          : quiz.questions,
      };

      setSelectedQuiz(startedQuiz);
      setCurrentQuestion(0);
      setAnswers(new Array(startedQuiz.questions?.length || 0).fill(null));
      setQuizResult(null);
      setMessage("");
      setPage("quiz");
    } catch (error) {
      console.log("START QUIZ ERROR:", error);
      setMessage("Quiz start karte waqt server error aa gaya.");
    }
  };

  const handleAnswerSelect = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (!selectedQuiz) return;

    if (answers[currentQuestion] === null) {
      setMessage("Pehle answer select karein.");
      return;
    }

    setMessage("");

    if (currentQuestion < selectedQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setMessage("");
    }
  };

  const handleSubmitQuiz = async (isAutoSubmit = false) => {
    if (!selectedQuiz) return;

    if (!isAutoSubmit && answers[currentQuestion] === null) {
      setMessage("Pehle current question ka answer select karein.");
      return;
    }

    if (!isAutoSubmit && answers.some((answer) => answer === null)) {
      setMessage("Please sab questions ke answers select karein.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Login session expire ho gaya. Dobara login karein.");
      setPage("login");
      return;
    }

    if (!quizSessionToken) {
      setMessage("Quiz session missing hai. Quiz dobara start karein.");
      return;
    }

    setSubmittingQuiz(true);
    setMessage(
      isAutoSubmit
        ? "⏰ Time khatam ho gaya! Quiz automatically submit ho raha hai..."
        : "Quiz submit ho raha hai..."
    );

    try {
      const response = await fetch(`${API}/api/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          quizId: selectedQuiz._id,
          answers,
          quizSessionToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Quiz submit nahi hua.");
        setSubmittingQuiz(false);
        return;
      }

      setQuizResult({
        score: data.score,
        totalQuestions: data.totalQuestions,
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks,
        percentage: data.percentage,
        passed: data.passed,
        autoSubmitted: data.autoSubmitted || false,
      });
      setMessage("");
      setPage("quizResult");
    } catch {
      setMessage("Quiz submit karte waqt server error aa gaya.");
    }

    setSubmittingQuiz(false);
  };

  useEffect(() => {
    if (
      page !== "quiz" ||
      !selectedQuiz ||
      !quizSessionToken ||
      submittingQuiz
    ) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [page, selectedQuiz?._id, quizSessionToken, submittingQuiz]);

  useEffect(() => {
    if (
      page === "quiz" &&
      selectedQuiz &&
      quizSessionToken &&
      timeLeft === 0 &&
      !submittingQuiz
    ) {
      handleSubmitQuiz(true);
    }
  }, [page, selectedQuiz, quizSessionToken, timeLeft, submittingQuiz]);

  // Dashboard par aate hi latest quiz history load karein, lekin page ko history par navigate na karein.
  useEffect(() => {
    if (page !== "dashboard") return;

    const token = localStorage.getItem("token");
    if (!token || user?.role === "teacher") return;

    let cancelled = false;

    const refreshDashboardData = async () => {
      try {
        const [quizResponse, historyResponse] = await Promise.all([
          fetch(`${API}/api/quizzes`),
          fetch(`${API}/api/attempts?token=${encodeURIComponent(token)}`),
        ]);

        const quizData = await quizResponse.json();
        const historyData = await historyResponse.json();

        if (cancelled) return;

        if (quizResponse.ok) {
          setQuizzes(quizData.quizzes || quizData || []);
        }

        if (historyResponse.ok) {
          setHistory(historyData.attempts || []);
        }
      } catch (error) {
        if (!cancelled) console.log("DASHBOARD DATA ERROR:", error);
      }
    };

    refreshDashboardData();

    return () => {
      cancelled = true;
    };
  }, [page, user?.role]);

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const loadQuizHistory = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login first.");
        setPage("login");
        return;
      }

      const response = await fetch(
        `${API}/api/attempts?token=${encodeURIComponent(token)}`
      );
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to load quiz history.");
        return;
      }

      setHistory(data.attempts || []);
      setMessage("");
      setPage("history");
    } catch {
      setMessage("Server se history load nahi ho saki.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setProfile(null);
    setSelectedQuiz(null);
    setQuizSessionToken("");
    setTimeLeft(0);
    setQuizzes([]);
    setHistory([]);
    setDisplayName("");
    setProfilePicture("");
    setTeacherId("");
    try {
      localStorage.removeItem("profileDisplayName");
      localStorage.removeItem("profilePicture");
    } catch {}
    setEmail("");
    setPassword("");
    setPage("login");
    setMessage("Logout successful.");
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("Reset request create ho rahi hai...");

    try {
      const response = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Request failed.");
        return;
      }

      setResetToken("");
      setMessage(data.message || "Agar account maujood hai to reset link email kar di gayi hai.");
    } catch {
      setMessage("Forgot password request failed.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("Password reset ho raha hai...");

    try {
      const response = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Password reset failed.");
        return;
      }

      setMessage("Password successfully reset ho gaya.");
      setPassword("");
      setResetToken("");
      setPage("login");
    } catch {
      setMessage("Password reset failed.");
    }
  };

  const question = selectedQuiz?.questions?.[currentQuestion] || null;

  const styles = {
    page: {
      minHeight: "100vh",
      padding: "32px 16px",
      boxSizing: "border-box",
      fontFamily:
        "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "var(--theme-bg)",
      color: "var(--theme-text)",
    },
    shell: {
      maxWidth: "980px",
      margin: "0 auto",
    },
    workspaceShell: {
      width: "100%",
      maxWidth: "none",
      margin: 0,
    },
    workspaceCard: {
      background: "transparent",
      border: "none",
      borderRadius: 0,
      padding: 0,
      boxShadow: "none",
      backdropFilter: "none",
    },
    card: {
      background: "var(--theme-panel-strong)",
      border: "1px solid var(--theme-border)",
      borderRadius: "20px",
      padding: "32px",
      boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
      backdropFilter: "blur(16px)",
    },
    wideCard: {
      background: "var(--theme-panel-strong)",
      border: "1px solid var(--theme-border)",
      borderRadius: "20px",
      padding: "32px",
      boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
    },
    title: {
      textAlign: "center",
      fontSize: "32px",
      margin: "0 0 8px",
      fontWeight: 800,
      letterSpacing: "0",
      color: "var(--theme-text)",
    },
    subtitle: {
      textAlign: "center",
      color: "var(--theme-muted)",
      margin: "0 0 28px",
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "14px 16px",
      marginBottom: "14px",
      border: "1px solid var(--theme-border)",
      borderRadius: "10px",
      fontSize: "15px",
      outline: "none",
      background: "rgba(255, 255, 255, 0.04)",
      color: "var(--theme-text)",
      boxShadow: "inset 0 1px 1px rgba(0, 0, 0, 0.2)",
    },
    button: {
      width: "100%",
      padding: "14px 18px",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "15px",
      fontWeight: 700,
      color: "white",
      background: "linear-gradient(110deg, #5143ec, #7865ff 55%, #6657f2)",
      boxShadow: "0 10px 22px rgba(91, 76, 246, 0.24)",
      transition: "transform .18s ease, box-shadow .18s ease",
      marginTop: "8px",
    },
    secondaryButton: {
      width: "100%",
      padding: "14px 18px",
      border: "1px solid var(--theme-border)",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "15px",
      fontWeight: 700,
      color: "var(--theme-text)",
      background: "rgba(255, 255, 255, 0.04)",
      transition: "transform .18s ease, background .18s ease",
      marginTop: "10px",
    },
    smallButton: {
      padding: "11px 15px",
      border: "none",
      borderRadius: "11px",
      cursor: "pointer",
      fontWeight: 700,
      color: "white",
      background: "linear-gradient(110deg, #5143ec, #7865ff 55%, #6657f2)",
    },
    linkButton: {
      background: "transparent",
      border: "none",
      color: "#36d7f5",
      cursor: "pointer",
      fontWeight: 700,
      marginTop: "18px",
      padding: "6px",
    },
    message: {
      padding: "13px 15px",
      borderRadius: "12px",
      background: "rgba(91, 76, 246, 0.12)",
      color: "#d7d2ff",
      marginBottom: "18px",
      border: "1px solid rgba(117, 103, 255, 0.26)",
    },
    info: {
      padding: "18px",
      borderRadius: "16px",
      background: "rgba(255, 255, 255, 0.035)",
      border: "1px solid var(--theme-border)",
      marginBottom: "20px",
      color: "var(--theme-text)",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
      gap: "15px",
      marginTop: "22px",
    },
    actionCard: {
      padding: "22px",
      borderRadius: "18px",
      border: "1px solid var(--theme-border)",
      background: "var(--theme-panel)",
      cursor: "pointer",
      transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
    },
    quizBox: {
      padding: "20px",
      borderRadius: "18px",
      border: "1px solid var(--theme-border)",
      background: "var(--theme-panel)",
      marginBottom: "15px",
      boxShadow: "0 8px 25px rgba(15,23,42,.22)",
    },
    option: {
      padding: "15px",
      borderRadius: "13px",
      border: "1px solid var(--theme-border)",
      marginBottom: "11px",
      cursor: "pointer",
      background: "rgba(255, 255, 255, 0.035)",
      transition: "all .18s ease",
      color: "var(--theme-text)",
    },
    selectedOption: {
      padding: "14px",
      borderRadius: "13px",
      border: "2px solid #29c8e8",
      marginBottom: "11px",
      cursor: "pointer",
      background: "rgba(41, 200, 232, 0.1)",
      color: "var(--theme-text)",
    },
    roleRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
      marginBottom: "8px",
    },
    roleCard: {
      border: "1px solid var(--theme-border)",
      borderRadius: "14px",
      padding: "14px",
      cursor: "pointer",
      textAlign: "center",
      background: "rgba(255, 255, 255, 0.035)",
      color: "var(--theme-text)",
    },
    selectedRole: {
      border: "2px solid #7567ff",
      borderRadius: "14px",
      padding: "13px",
      cursor: "pointer",
      textAlign: "center",
      background: "rgba(117, 103, 255, 0.14)",
      color: "var(--theme-text)",
    },
    navigation: {
      display: "flex",
      gap: "10px",
      marginTop: "20px",
    },
    formLabel: {
      display: "block",
      fontWeight: 700,
      marginBottom: "8px",
      marginTop: "14px",
      color: "var(--theme-muted)",
    },
    checkboxRow: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 0",
      cursor: "pointer",
    },
  };

  const HoverButton = ({ children, style, ...props }) => {
    const [hover, setHover] = useState(false);
    return (
      <button
        {...props}
        style={{
          ...style,
          transform: hover ? "translateY(-2px)" : "translateY(0)",
          boxShadow: hover
            ? "0 12px 25px rgba(37,99,235,.28)"
            : style?.boxShadow,
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {children}
      </button>
    );
  };

  const DashboardAction = ({ icon, title, text, onClick }) => {
    const [hover, setHover] = useState(false);
    return (
      <div
        style={{
          ...styles.actionCard,
          transform: hover ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hover ? "0 15px 35px rgba(15,23,42,.10)" : "none",
          borderColor: hover ? "#8b81ff" : "var(--theme-border)",
        }}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div style={{ fontSize: "30px", marginBottom: "10px" }}>{icon}</div>
        <h3 style={{ margin: "0 0 7px" }}>{title}</h3>
        <p style={{ color: "#64748b", margin: 0, lineHeight: 1.5 }}>{text}</p>
      </div>
    );
  };

  const showWorkspaceShell = ![
    "login",
    "register",
    "forgot",
    "reset",
    "dashboard",
    "quizList",
    "quiz",
  ].includes(page);
  const isStudentFullWidthPage = page === "dashboard" || page === "quizList";
  const useFullWidthShell = showWorkspaceShell || isStudentFullWidthPage;
  const isTeacher = user?.role === "teacher";
  const workspaceNavigation = isTeacher
    ? [
        ["⌂", "Dashboard", "teacherDashboard"],
        ["＋", "Create Quiz", "createQuiz"],
        ["▤", "Manage Quizzes", "manageQuizzes"],
        ["▥", "Student Results", "teacherResults"],
        ["◉", "Edit Profile", "editProfile"],
      ]
    : [
        ["⌂", "Dashboard", "dashboard"],
        ["▦", "Available Quizzes", "quizList"],
        ["▤", "My Results", "history"],
        ["◉", "Profile", "editProfile"],
      ];
  const workspacePageTitle = {
    teacherDashboard: "Teacher Dashboard",
    createQuiz: editingQuizId ? "Edit Quiz" : "Create Quiz",
    editQuiz: "Edit Quiz",
    manageQuizzes: "Manage Quizzes",
    teacherResults: "Student Results",
    history: "My Results",
    profile: "Student Profile",
    editProfile: "Profile Settings",
    quizResult: "Quiz Result",
  }[page] || "Quiz Workspace";

  const handleWorkspaceNavigation = (target) => {
    clearMessage();

    if (target === "history") {
      loadQuizHistory();
    } else if (target === "quizList") {
      handleStartQuiz();
    } else if (target === "manageQuizzes") {
      setPage(target);
      loadTeacherQuizzes();
    } else if (target === "teacherResults") {
      loadTeacherResults();
    } else if (target === "createQuiz") {
      resetQuizForm();
      setPage(target);
    } else {
      setPage(target);
    }
  };

  return (
    <div style={useFullWidthShell ? { ...styles.page, padding: 0, background: "var(--theme-bg)" } : styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        button:hover { filter: brightness(1.03); }
        input:focus, textarea:focus {
          border-color: #2876c7 !important;
          box-shadow: 0 0 0 3px rgba(40,118,199,.12);
        }
        @media (max-width: 600px) {
          .app-card { padding: 22px !important; }
          .app-title { font-size: 28px !important; }
        }
      `}</style>

      <div className={showWorkspaceShell ? "workspace-shell" : "app-outer"}>
        {showWorkspaceShell && (
          <aside className="workspace-sidebar">
            <div className="workspace-brand">
              <span className="workspace-brand-mark">Q</span>
              <span>
                <strong>QuizHub</strong>
                <small>Learning workspace</small>
              </span>
            </div>
            <div className="workspace-nav-label">WORKSPACE</div>
            <nav className="workspace-nav" aria-label="Main navigation">
              {workspaceNavigation.map(([icon, label, target]) => (
                <button
                  key={target}
                  type="button"
                  className={page === target || (target === "createQuiz" && page === "editQuiz") ? "workspace-nav-item is-active" : "workspace-nav-item"}
                  onClick={() => handleWorkspaceNavigation(target)}
                >
                  <span className="workspace-nav-icon" aria-hidden="true">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <div className="workspace-sidebar-bottom">
              <div className="workspace-role">{isTeacher ? "TEACHER ACCOUNT" : "STUDENT ACCOUNT"}</div>
              <button type="button" className="workspace-nav-item" onClick={handleLogout}>
                <span className="workspace-nav-icon" aria-hidden="true">↪</span>
                <span>Log out</span>
              </button>
            </div>
          </aside>
        )}
        <div className={showWorkspaceShell ? "workspace-main" : "app-main"}>
          {showWorkspaceShell && (
            <header className="workspace-topbar">
              <div>
                <div className="workspace-eyebrow">{isTeacher ? "TEACHER PORTAL" : "STUDENT PORTAL"}</div>
                <h1>{workspacePageTitle}</h1>
              </div>
              <div className="workspace-user">
                <span className="workspace-avatar">
                  {profilePicture ? <img src={profilePicture} alt="" /> : (user?.name || "U").charAt(0).toUpperCase()}
                </span>
                <span className="workspace-user-copy">
                  <strong>{user?.name || shownName}</strong>
                  <small>{isTeacher ? "Teacher" : "Student"}</small>
                </span>
              </div>
            </header>
          )}
          <div className={showWorkspaceShell ? "workspace-content" : "app-content"}>

      <div className={useFullWidthShell ? "app-shell app-shell-workspace" : "app-shell"} style={useFullWidthShell ? { ...styles.shell, ...styles.workspaceShell } : styles.shell}>
        <div className="app-card" style={useFullWidthShell ? styles.workspaceCard : styles.card}>
          {page === "login" && (
            <>
              <div className="auth-hero">
                <div className="auth-icon-bubble">🎓</div>
              </div>
              <div className="auth-mini-badges">
                <span>Live</span>
                <span>Secure</span>
              </div>
              <h1 className="app-title auth-title" style={styles.title}>QuizMaster</h1>
              <p style={styles.subtitle}>Login to your student or teacher account</p>

              {message && <div style={styles.message}>{message}</div>}

              <form className="auth-form" onSubmit={handleLogin}>
                <label style={styles.formLabel} htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  className="auth-input"
                  style={styles.input}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <label style={styles.formLabel} htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  className="auth-input"
                  style={styles.input}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <HoverButton className="auth-button" style={styles.button} type="submit">Login</HoverButton>
              </form>

              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                <button type="button" className="auth-link" style={styles.linkButton} onClick={() => { setPage("register"); clearMessage(); }}>
                  Create a student or teacher account
                </button>
                <button type="button" className="auth-link" style={styles.linkButton} onClick={() => { setPage("forgot"); clearMessage(); }}>
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {page === "verifyingEmail" && (
            <div role="status" aria-live="polite" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "42px" }}>✉️</div>
              <h1 className="app-title" style={styles.title}>Confirming Email</h1>
              <p style={styles.subtitle}>Please wait while we verify your email and create your account.</p>
            </div>
          )}

          {page === "verificationPending" && (
            <div role="status" aria-live="polite" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "42px" }}>✉️</div>
              <h1 className="app-title" style={styles.title}>Check Your Email</h1>
              <p style={styles.subtitle}>
                Confirmation link {verificationEmail ? `${verificationEmail} par ` : "aapke email par "}bhej di hai. Link click karne ke baad hi account create hoga.
              </p>
              <button type="button" style={styles.linkButton} onClick={() => { setPage("login"); clearMessage(); }}>
                Back to Login
              </button>
            </div>
          )}

          {page === "register" && (
            <>
              <div className="auth-hero auth-hero-signup">
                <div className="auth-icon-bubble auth-icon-bubble-alt">✨</div>
              </div>
              <h1 className="app-title auth-title" style={styles.title}>Create Account</h1>
              <p style={styles.subtitle}>Student ya Teacher account choose karein</p>

              {message && <div style={styles.message}>{message}</div>}

              <form className="auth-form auth-form-signup" onSubmit={handleRegister}>
                <input
                  className="auth-input"
                  style={styles.input}
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  className="auth-input"
                  style={styles.input}
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div style={{ position: "relative", marginBottom: "14px" }}>
                  <input
                    className="auth-input"
                    style={{ ...styles.input, marginBottom: 0, paddingRight: "52px" }}
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="Password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-visibility-button"
                    aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                    title={showRegisterPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowRegisterPassword((visible) => !visible)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", border: 0, background: "transparent", color: "#475569", cursor: "pointer", padding: "6px", display: "grid", placeItems: "center" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                      {!showRegisterPassword && <path d="m3 3 18 18" />}
                    </svg>
                  </button>
                </div>
                <div style={{ position: "relative", marginBottom: "14px" }}>
                  <input
                    className="auth-input"
                    style={{ ...styles.input, marginBottom: 0, paddingRight: "52px" }}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-visibility-button"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", border: 0, background: "transparent", color: "#475569", cursor: "pointer", padding: "6px", display: "grid", placeItems: "center" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                      {!showConfirmPassword && <path d="m3 3 18 18" />}
                    </svg>
                  </button>
                </div>

                {registerRole === "student" && (
                  <input
                    className="auth-input"
                    style={styles.input}
                    type="text"
                    placeholder="Roll Number"
                    value={registerRollNumber}
                    onChange={(e) => setRegisterRollNumber(e.target.value)}
                    required
                  />
                )}

                <p style={{ fontWeight: 700, marginBottom: "10px" }}>Account Type</p>
                <div style={styles.roleRow}>
                  <button
                    type="button"
                    className="auth-role-button"
                    style={registerRole === "student" ? styles.selectedRole : styles.roleCard}
                    onClick={() => setRegisterRole("student")}
                    aria-pressed={registerRole === "student"}
                  >
                    <div style={{ fontSize: "28px" }}>🎓</div>
                    <strong>Student</strong>
                  </button>
                  <button
                    type="button"
                    className="auth-role-button"
                    style={registerRole === "teacher" ? styles.selectedRole : styles.roleCard}
                    onClick={() => setRegisterRole("teacher")}
                    aria-pressed={registerRole === "teacher"}
                  >
                    <div style={{ fontSize: "28px" }}>👨‍🏫</div>
                    <strong>Teacher</strong>
                  </button>
                </div>

                <HoverButton className="auth-button" style={styles.button} type="submit">
                  Register Account
                </HoverButton>
              </form>

              <div style={{ textAlign: "center" }}>
                <button
                  className="auth-link"
                  style={styles.linkButton}
                  onClick={() => {
                    setPage("login");
                    clearMessage();
                  }}
                >
                  ← Already have an account? Login
                </button>
              </div>
            </>
          )}

          {page === "profile" && (
            <>
              <h1 style={styles.title}>🎓 Student Profile</h1>
              <p style={styles.subtitle}>Quiz start karne se pehle profile complete karein</p>
              {message && <div style={styles.message}>{message}</div>}

              <form onSubmit={handleCreateProfile}>
                <div style={{ display: "grid", placeItems: "center", marginBottom: "16px" }}>
                  <div style={{ width: "92px", height: "92px", borderRadius: "50%", overflow: "hidden", background: "#eaf2ff", border: "3px solid #dbeafe", display: "grid", placeItems: "center", fontSize: "34px", color: "#24508a", fontWeight: 800 }}>
                    {profilePicture ? <img src={profilePicture} alt="Profile preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (displayName || user?.name || "S").charAt(0).toUpperCase()}
                  </div>
                  <label style={{ ...styles.secondaryButton, width: "auto", marginTop: "10px", padding: "9px 14px", cursor: "pointer" }}>
                    📷 Add Profile Picture
                    <input type="file" accept="image/*" onChange={handleProfilePictureChange} style={{ display: "none" }} />
                  </label>
                </div>
                <input style={styles.input} placeholder="Full Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                <input style={styles.input} placeholder="Class" value={className} onChange={(e) => setClassName(e.target.value)} required />
                <input style={styles.input} placeholder="Section" value={section} onChange={(e) => setSection(e.target.value)} required />
                <input style={styles.input} placeholder="Roll Number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required />
                <input style={styles.input} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                <HoverButton style={styles.button} type="submit">Save Profile ✓</HoverButton>
              </form>
            </>
          )}

          {page === "dashboard" && (() => {
            const now = new Date();
            const completedQuizIds = new Set(
              history
                .map((attempt) => attempt.quiz?._id || attempt.quiz)
                .filter(Boolean)
                .map((id) => id.toString())
            );

            const completedCount = completedQuizIds.size;
            const pendingCount = Math.max(0, quizzes.length - completedCount);
            const averageScore = history.length
              ? Math.round(
                  history.reduce((sum, attempt) => {
                    const total = Number(attempt.totalMarks ?? attempt.totalQuestions) || 0;
                    const score = Number(attempt.score) || 0;
                    return sum + (total > 0 ? (score / total) * 100 : 0);
                  }, 0) / history.length
                )
              : 0;

            const formatDashboardDate = (value) => {
              if (!value) return "Not set";
              const date = new Date(value);
              if (Number.isNaN(date.getTime())) return "Not set";
              return date.toLocaleString([], {
                month: "short",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
            };

            const getDashboardStatus = (quiz) => {
              const start = quiz.startDateTime ? new Date(quiz.startDateTime) : null;
              const end = quiz.endDateTime ? new Date(quiz.endDateTime) : null;
              const completed = completedQuizIds.has(quiz._id?.toString());

              if (completed) return { label: "Completed", color: "#15803d", bg: "#f0fdf4", available: false };
              if (start && !Number.isNaN(start.getTime()) && start > now) {
                return { label: "Pending", color: "#dc2626", bg: "#fef2f2", available: false };
              }
              if (end && !Number.isNaN(end.getTime()) && end < now) {
                return { label: "Expired", color: "#64748b", bg: "#f1f5f9", available: false };
              }
              if (start && !Number.isNaN(start.getTime())) {
                return { label: "Ongoing", color: "#b45309", bg: "#fffbeb", available: true };
              }
              return { label: "Available", color: "#15803d", bg: "#f0fdf4", available: true };
            };

            const availablePreview = quizzes.slice(0, 4);
            const upcomingQuizzes = quizzes
              .filter((quiz) => {
                const start = quiz.startDateTime ? new Date(quiz.startDateTime) : null;
                return start && !Number.isNaN(start.getTime()) && start > now;
              })
              .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
              .slice(0, 3);

            const statCard = (icon, label, value, description, iconBg) => (
              <div
                style={{
                  flex: "1 1 180px",
                  minWidth: "170px",
                  background: "var(--theme-panel)",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "12px",
                  padding: "15px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  boxShadow: "0 8px 22px rgba(0,0,0,.2)",
                }}
              >
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: iconBg, display: "grid", placeItems: "center", fontSize: "21px", flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ color: "var(--theme-muted)", fontSize: "11px", marginBottom: "4px" }}>{label}</div>
                  <div style={{ color: "var(--theme-text)", fontSize: "22px", fontWeight: 800 }}>{value}</div>
                  <div style={{ color: "var(--theme-muted)", fontSize: "9px", marginTop: "2px" }}>{description}</div>
                </div>
              </div>
            );

            return (
              <div
                className="student-portal-frame"
                style={{
                  margin: 0,
                  minHeight: "720px",
                  background: "var(--theme-bg)",
                  display: "flex",
                  overflow: "hidden",
                  borderRadius: "12px",
                }}
              >
                <aside
                  className="student-portal-sidebar"
                  style={{
                    width: "190px",
                    background: "linear-gradient(180deg, #0a1024 0%, #101a38 100%)",
                    color: "white",
                    padding: "18px 11px",
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "4px 9px 19px", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
                    <div style={{ fontSize: "28px" }}>🎓</div>
                    <div>
                      <div style={{ fontSize: "19px", fontWeight: 800 }}>QuizHub</div>
                      <div style={{ fontSize: "9px", opacity: .75 }}>Learn • Take Quiz • Grow</div>
                    </div>
                  </div>

                  <div className="student-portal-nav" style={{ marginTop: "18px", display: "grid", gap: "5px" }}>
                    {[
                      ["🏠", "Dashboard", "dashboard"],
                      ["▦", "Available Quizzes", "quizList"],
                      ["📄", "My Quizzes", "history"],
                      ["📊", "Results", "history"],
                      ["👤", "Profile", "editProfile"],
                    ].map(([icon, label, target]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          clearMessage();
                          if (target === "history") loadQuizHistory();
                          else if (target === "editProfile") setPage("editProfile");
                          else setPage(target);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          border: "none",
                          borderRadius: "8px",
                          padding: "11px 10px",
                          cursor: "pointer",
                          color: "white",
                          background: target === "dashboard" ? "linear-gradient(100deg, #5143ec, #6657f2)" : "transparent",
                          fontWeight: target === "dashboard" ? 800 : 600,
                          fontSize: "12px",
                        }}
                      >
                        <span style={{ marginRight: "10px", fontSize: "16px" }}>{icon}</span>{label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      marginTop: "auto",
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      background: "transparent",
                      color: "white",
                      padding: "11px 10px",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "12px",
                    }}
                  >
                    <span style={{ marginRight: "10px" }}>↪</span> Logout
                  </button>
                </aside>

                <main className="student-portal-main" style={{ flex: 1, minWidth: 0, padding: "14px 18px 22px", overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", paddingBottom: "11px", borderBottom: "1px solid #e2e8f0" }}>
                    <div style={{ flex: 1, maxWidth: "500px", display: "flex", gap: "7px" }}>
                      <input
                        value={quizSearch}
                        onChange={(e) => setQuizSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleGlobalSearch(); }}
                        placeholder="⌕  Search quizzes, subjects..."
                        aria-label="Search quizzes and subjects"
                        style={{ ...styles.input, margin: 0, width: "100%", padding: "9px 12px" }}
                      />
                      <button type="button" onClick={handleGlobalSearch} style={{ ...styles.smallButton, width: "auto", marginTop: 0, borderRadius: "8px", padding: "0 14px" }}>Search</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ fontSize: "20px" }}>🔔</div>
                      <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#0f3b78", color: "white", display: "grid", placeItems: "center", fontWeight: 800 }}>
                        {profilePicture ? <img src={profilePicture} alt="Profile" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : shownName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ lineHeight: 1.1 }}>
                        <div style={{ fontWeight: 800, fontSize: "12px", color: "var(--theme-text)" }}>{shownName}</div>
                        <div style={{ color: "#64748b", fontSize: "10px" }}>Student</div>
                      </div>
                    </div>
                  </div>

                  <div className="student-dashboard-columns" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 235px", gap: "14px", marginTop: "14px" }}>
                    <section style={{ minWidth: 0 }}>
                      <div style={{ borderRadius: "12px", padding: "18px", background: "linear-gradient(110deg, #322a8d, #204d92 62%, #152a51)", border: "1px solid rgba(137, 126, 255, 0.32)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
                        <div>
                          <h1 style={{ margin: 0, color: "var(--theme-text)", fontSize: "21px" }}>Hello, {shownName}! 👋</h1>
                          <p style={{ margin: "7px 0 0", color: "var(--theme-muted)", fontSize: "11px" }}>Keep learning, keep growing!</p>
                          <p style={{ margin: "4px 0 0", color: "var(--theme-muted)", fontSize: "10px" }}>Your progress today builds a better tomorrow.</p>
                        </div>
                        <div style={{ fontSize: "48px" }}>📚</div>
                      </div>

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                        {statCard("▤", "Total Quizzes", quizzes.length, "All quizzes assigned to you", "rgba(91, 76, 246, 0.2)")}
                        {statCard("✓", "Completed Quizzes", completedCount, "You have completed", "rgba(34, 211, 238, 0.16)")}
                        {statCard("◷", "Pending Quizzes", pendingCount, "Quizzes to be taken", "rgba(251, 146, 60, 0.16)")}
                        {statCard("★", "Average Score", `${averageScore}%`, "Your overall performance", "rgba(167, 139, 250, 0.18)")}
                      </div>

                      {message && <div style={{ ...styles.message, marginTop: "12px" }}>{message}</div>}

                      <div style={{ marginTop: "13px", background: "var(--theme-panel)", border: "1px solid var(--theme-border)", borderRadius: "12px", padding: "13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <div>
                            <h2 style={{ margin: 0, fontSize: "16px", color: "var(--theme-text)" }}>☷ Available Quizzes</h2>
                            <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: "9px" }}>Explore and take the quizzes assigned to you.</p>
                          </div>
                          <button type="button" onClick={() => setPage("quizList")} style={{ border: "none", background: "transparent", color: "#1672df", fontWeight: 700, cursor: "pointer", fontSize: "10px" }}>View All →</button>
                        </div>

                        <div style={{ display: "grid", gap: "8px" }}>
                          {availablePreview.length === 0 ? (
                            <div style={{ padding: "18px", textAlign: "center", color: "#64748b", fontSize: "11px" }}>No quizzes available right now.</div>
                          ) : availablePreview.map((quiz) => {
                            const status = getDashboardStatus(quiz);
                            const totalMarks = Number(quiz.totalMarks) || quiz.questions?.reduce((sum, q) => sum + (Number(q.marks) || 1), 0) || quiz.questions?.length || 0;
                            return (
                              <div key={quiz._id} className="student-quiz-row" style={{ border: "1px solid var(--theme-border)", borderRadius: "9px", padding: "10px", display: "grid", gridTemplateColumns: "42px minmax(170px,1.5fr) minmax(135px,.8fr) minmax(125px,.7fr)", gap: "10px", alignItems: "center", background: "rgba(255, 255, 255, 0.02)" }}>
                                <div style={{ width: "38px", height: "38px", borderRadius: "9px", background: "#fff1c7", display: "grid", placeItems: "center", fontSize: "18px", fontWeight: 800 }}>{quiz.subject?.toLowerCase().includes("javascript") ? "JS" : quiz.subject?.toLowerCase().includes("python") ? "🐍" : quiz.subject?.toLowerCase().includes("database") ? "🗄️" : "📝"}</div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                    <strong style={{ color: "var(--theme-text)", fontSize: "11px" }}>{quiz.title}</strong>
                                    <span style={{ padding: "3px 6px", borderRadius: "15px", background: status.bg, color: status.color, fontSize: "8px", fontWeight: 800 }}>{status.label}</span>
                                  </div>
                                  <div style={{ color: "#64748b", fontSize: "9px", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{quiz.description || "Test your knowledge and improve your skills."}</div>
                                  <div style={{ display: "flex", gap: "7px", marginTop: "5px", color: "#64748b", fontSize: "8px", flexWrap: "wrap" }}><span>📚 {quiz.subject || "General"}</span><span>🏛️ {quiz.department || "All"}</span><span>👥 {quiz.classSemester || "All Classes"}</span></div>
                                </div>
                                <div style={{ color: "#475569", fontSize: "9px", display: "grid", gap: "4px" }}><div>◷ Time: {quiz.timeLimit || 30} min</div><div>▣ Marks: {totalMarks}</div><div>✓ Pass: {quiz.passingMarks || 0}</div></div>
                                <div style={{ display: "grid", gap: "5px" }}><div style={{ color: "#64748b", fontSize: "8px" }}>📅 {formatDashboardDate(quiz.startDateTime)}</div><HoverButton style={{ ...styles.smallButton, width: "100%", padding: "7px 8px", fontSize: "9px", opacity: status.available ? 1 : .55 }} disabled={!status.available} onClick={() => status.available && handleOpenQuiz(quiz)}>{status.available ? "▶ Take Quiz" : "◷ Not Available"}</HoverButton></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ marginTop: "12px", background: "var(--theme-panel)", border: "1px solid var(--theme-border)", borderRadius: "12px", padding: "13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}><h2 style={{ margin: 0, fontSize: "15px", color: "var(--theme-text)" }}>▣ Recent Results</h2><button type="button" onClick={loadQuizHistory} style={{ border: "none", background: "transparent", color: "#36d7f5", fontWeight: 700, cursor: "pointer", fontSize: "9px" }}>View All</button></div>
                        {history.length === 0 ? <div style={{ color: "#64748b", fontSize: "10px", padding: "8px 0" }}>No results yet. Complete a quiz to see your performance here.</div> : (
                          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}><thead><tr style={{ color: "#64748b", textAlign: "left" }}><th style={{ padding: "7px" }}>Quiz Title</th><th style={{ padding: "7px" }}>Subject</th><th style={{ padding: "7px" }}>Marks</th><th style={{ padding: "7px" }}>Percentage</th><th style={{ padding: "7px" }}>Date</th><th style={{ padding: "7px" }}>Status</th></tr></thead><tbody>{history.slice(0, 3).map((attempt) => { const total = Number(attempt.totalMarks ?? attempt.totalQuestions) || 0; const score = Number(attempt.score) || 0; const percentage = total ? Math.round((score / total) * 100) : 0; const passed = attempt.passed ?? (percentage >= 50); return <tr key={attempt._id} style={{ borderTop: "1px solid #edf2f7" }}><td style={{ padding: "7px", color: "#173b72", fontWeight: 700 }}>{attempt.quiz?.title || "Quiz"}</td><td style={{ padding: "7px", color: "#64748b" }}>{attempt.quiz?.subject || "—"}</td><td style={{ padding: "7px" }}>{score} / {total}</td><td style={{ padding: "7px", fontWeight: 700 }}>{percentage}%</td><td style={{ padding: "7px", color: "#64748b" }}>{attempt.createdAt ? new Date(attempt.createdAt).toLocaleDateString() : "—"}</td><td style={{ padding: "7px" }}><span style={{ padding: "3px 6px", borderRadius: "12px", background: passed ? "#ecfdf3" : "#fef2f2", color: passed ? "#15803d" : "#dc2626", fontWeight: 800 }}>{passed ? "✓ Passed" : "Failed"}</span></td></tr>; })}</tbody></table></div>
                        )}
                      </div>
                    </section>

                    <aside style={{ display: "grid", alignContent: "start", gap: "12px" }}>
                      <div style={{ background: "var(--theme-panel)", border: "1px solid var(--theme-border)", borderRadius: "12px", padding: "15px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#0f4a9b", color: "#fff", display: "grid", placeItems: "center", fontSize: "21px", fontWeight: 800 }}>{profilePicture ? <img src={profilePicture} alt="Profile" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : shownName.charAt(0).toUpperCase()}</div><div><strong style={{ color: "#173b72", fontSize: "12px" }}>{shownName}</strong><div style={{ color: "#64748b", fontSize: "9px" }}>Student</div></div></div>
                        <div style={{ marginTop: "14px", display: "grid", gap: "9px", color: "#475569", fontSize: "9px" }}><div>♙ <strong>Class / Semester</strong><br/><span style={{ marginLeft: "18px" }}>{profile?.className || "Not set"} {profile?.section ? `• ${profile.section}` : ""}</span></div><div>⌂ <strong>Department</strong><br/><span style={{ marginLeft: "18px" }}>{profile?.department || "Software Engineering"}</span></div><div>◎ <strong>Roll No</strong><br/><span style={{ marginLeft: "18px" }}>{profile?.rollNumber || user?.rollNumber || "Not set"}</span></div></div>
                        <button type="button" onClick={() => { clearMessage(); setPage("editProfile"); }} style={{ marginTop: "13px", width: "100%", border: "1px solid #dbeafe", background: "#f7fbff", color: "#24508a", borderRadius: "7px", padding: "8px", fontWeight: 700, cursor: "pointer", fontSize: "9px" }}>♙ View Profile</button>
                      </div>

                      <div style={{ background: "var(--theme-panel)", border: "1px solid var(--theme-border)", borderRadius: "12px", padding: "13px" }}>
                        <h3 style={{ margin: "0 0 9px", color: "var(--theme-text)", fontSize: "13px" }}>⚡ Quick Actions</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
                          <button type="button" onClick={handleStartQuiz} style={{ border: "1px solid #dbeafe", background: "#eff6ff", color: "#24508a", borderRadius: "8px", padding: "10px 5px", cursor: "pointer", fontSize: "9px", fontWeight: 700 }}>▶<br/>Take Quiz</button>
                          <button type="button" onClick={loadQuizHistory} style={{ border: "1px solid #d1fae5", background: "#ecfdf5", color: "#166534", borderRadius: "8px", padding: "10px 5px", cursor: "pointer", fontSize: "9px", fontWeight: 700 }}>▥<br/>View Results</button>
                          <button type="button" onClick={() => setPage("history")} style={{ border: "1px solid #ede9fe", background: "#f5f3ff", color: "#5b21b6", borderRadius: "8px", padding: "10px 5px", cursor: "pointer", fontSize: "9px", fontWeight: 700 }}>☷<br/>My Quizzes</button>
                          <button type="button" onClick={() => setPage("editProfile")} style={{ border: "1px solid #ffedd5", background: "#fff7ed", color: "#9a3412", borderRadius: "8px", padding: "10px 5px", cursor: "pointer", fontSize: "9px", fontWeight: 700 }}>♙<br/>Update Profile</button>
                        </div>
                      </div>

                      <div style={{ background: "var(--theme-panel)", border: "1px solid var(--theme-border)", borderRadius: "12px", padding: "13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}><h3 style={{ margin: 0, color: "var(--theme-text)", fontSize: "13px" }}>▣ Upcoming Quizzes</h3><button type="button" onClick={() => setPage("quizList")} style={{ border: "none", background: "transparent", color: "#36d7f5", cursor: "pointer", fontSize: "9px", fontWeight: 700 }}>View All</button></div>
                        {upcomingQuizzes.length === 0 ? <div style={{ color: "#64748b", fontSize: "9px", padding: "5px 0" }}>No upcoming quizzes.</div> : upcomingQuizzes.map((quiz) => <div key={quiz._id} style={{ borderTop: "1px solid #edf2f7", padding: "8px 0" }}><div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}><strong style={{ color: "#334155", fontSize: "9px" }}>{quiz.title}</strong><span style={{ color: "#dc2626", background: "#fef2f2", padding: "3px 5px", borderRadius: "10px", fontSize: "7px", fontWeight: 800 }}>Pending</span></div><div style={{ marginTop: "3px", color: "#64748b", fontSize: "8px" }}>{formatDashboardDate(quiz.startDateTime)}</div></div>)}
                      </div>
                    </aside>
                  </div>
                </main>
              </div>
            );
          })()}

          {page === "teacherDashboard" && (
            <>
              <div style={{ textAlign: "center", fontSize: "48px" }}>👨‍🏫</div>
              <h1 className="app-title" style={styles.title}>
                Welcome, {user?.name || "Teacher"}!
              </h1>
              <p style={styles.subtitle}>Teacher Dashboard</p>

              {message && <div style={styles.message}>{message}</div>}

              <div style={styles.info}>
                <h3 style={{ marginTop: 0 }}>Teacher Account</h3>
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Teacher ID:</strong> {teacherId || user?.teacherId || "Not set"}</p>
                <p><strong>Role:</strong> Teacher</p>
              </div>

              <div style={styles.grid}>
                <DashboardAction
                  icon="➕"
                  title="Add New Quiz"
                  text="Naya quiz questions aur 4 options ke saath create karein."
                  onClick={() => { resetQuizForm(); clearMessage(); setPage("createQuiz"); }}
                />
                <DashboardAction
                  icon="📋"
                  title="Manage Quizzes"
                  text="Apne banaye huay quizzes dekhein, edit karein aur delete karein."
                  onClick={() => { clearMessage(); setPage("manageQuizzes"); loadTeacherQuizzes(); }}
                />
                <DashboardAction
                  icon="📊"
                  title="View Results"
                  text="Students ke quiz results ka section."
                  onClick={loadTeacherResults}
                />
                <DashboardAction
                  icon="🚪"
                  title="Logout"
                  text="Securely account se logout karein."
                  onClick={handleLogout}
                />
              </div>
            </>
          )}

          {page === "teacherResults" && (
            <>
              <h1 style={styles.title}>📊 Student Results</h1>
              <p style={styles.subtitle}>
                Aapke quizzes attempt karne wale students ke results
              </p>

              {message && <div style={styles.message}>{message}</div>}

              {loadingTeacherResults ? (
                <div style={{ ...styles.info, textAlign: "center" }}>
                  Results load ho rahe hain...
                </div>
              ) : teacherResults.length === 0 ? (
                <div style={{ ...styles.info, textAlign: "center" }}>
                  <h2>No Results Yet</h2>
                  <p>
                    Abhi tak aapke kisi quiz ka student attempt record nahi mila.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <div
                    style={{
                      minWidth: "1100px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      overflow: "hidden",
                      background: "white",
                    }}
                  >

                    {/* TABLE HEADER */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1.4fr 1.8fr 1.5fr 0.9fr 0.9fr 1.6fr 1.4fr",
                        gap: "0",
                        background: "#f8fafc",
                        fontWeight: 700,
                        padding: "14px 16px",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <div>Student</div>
                      <div>Email</div>
                      <div>Quiz</div>
                      <div>Score</div>
                      <div>Percent</div>
                      <div>Status</div>
                      <div>Date</div>
                    </div>

                    {/* RESULTS */}
                    {teacherResults.map((attempt) => (
                      <div
                        key={attempt._id}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "1.4fr 1.8fr 1.5fr 0.9fr 0.9fr 1.6fr 1.4fr",
                          gap: "0",
                          padding: "14px 16px",
                          borderBottom: "1px solid #e2e8f0",
                          alignItems: "center",
                        }}
                      >

                        {/* STUDENT */}
                        <div>
                          <strong>
                            {attempt.student?.name || "Unknown Student"}
                          </strong>

                          <div
                            style={{
                              fontSize: "13px",
                              color: "#64748b",
                              marginTop: "3px",
                            }}
                          >
                            Roll No:{" "}
                            {attempt.student?.rollNumber || "N/A"}
                          </div>
                        </div>

                        {/* EMAIL */}
                        <div>
                          {attempt.student?.email || "N/A"}
                        </div>

                        {/* QUIZ */}
                        <div>
                          {attempt.quiz?.title || "Quiz"}
                        </div>

                        {/* SCORE */}
                        <div>
                          {attempt.score} / {attempt.totalQuestions}
                        </div>

                        {/* PERCENTAGE */}
                        <div>
                          {attempt.percentage ?? 0}%
                        </div>

                        {/* STATUS */}
                        <div>
                          {attempt.autoSubmitted ? (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "7px 10px",
                                borderRadius: "9px",
                                background: "#fef2f2",
                                color: "#dc2626",
                                fontWeight: 700,
                                fontSize: "13px",
                              }}
                            >
                              ⏰ Auto Submitted
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "7px 10px",
                                borderRadius: "9px",
                                background: "#ecfdf5",
                                color: "#059669",
                                fontWeight: 700,
                                fontSize: "13px",
                              }}
                            >
                              ✅ Submitted
                            </span>
                          )}
                        </div>

                        {/* DATE */}
                        <div>
                          {attempt.createdAt
                            ? new Date(
                              attempt.createdAt
                            ).toLocaleString()
                            : "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <HoverButton
                style={styles.secondaryButton}
                onClick={() => {
                  clearMessage();
                  setPage("teacherDashboard");
                }}
              >
                ← Back to Teacher Dashboard
              </HoverButton>
            </>
          )}

          {page === "createQuiz" && (
            <>
              <h1 style={styles.title}>➕ Create New Quiz</h1>
              <p style={styles.subtitle}>
                Professional quiz setup — information, marks, settings aur students assignment
              </p>

              {message && <div style={styles.message}>{message}</div>}

              <form onSubmit={handleCreateQuiz}>
                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>📝 Quiz Information</h2>

                  <label style={styles.formLabel}>Quiz Title *</label>
                  <input
                    style={styles.input}
                    placeholder="e.g. Object Oriented Programming Midterm"
                    value={newQuizTitle}
                    onChange={(e) => setNewQuizTitle(e.target.value)}
                    required
                  />

                  <div style={styles.grid}>
                    <div>
                      <label style={styles.formLabel}>Subject</label>
                      <input
                        style={styles.input}
                        placeholder="e.g. Computer Science"
                        value={newQuizSubject}
                        onChange={(e) => setNewQuizSubject(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={styles.formLabel}>Department</label>
                      <input
                        style={styles.input}
                        placeholder="e.g. BS Software Engineering"
                        value={newQuizDepartment}
                        onChange={(e) => setNewQuizDepartment(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={styles.formLabel}>Class / Semester</label>
                      <input
                        style={styles.input}
                        placeholder="e.g. BSSE 5th Semester"
                        value={newQuizClassSemester}
                        onChange={(e) => setNewQuizClassSemester(e.target.value)}
                      />
                    </div>
                  </div>

                  <label style={styles.formLabel}>Description / Instructions</label>
                  <textarea
                    style={{ ...styles.input, minHeight: "110px", resize: "vertical" }}
                    placeholder="Students ke liye instructions likhein..."
                    value={newQuizDescription}
                    onChange={(e) => setNewQuizDescription(e.target.value)}
                  />
                </div>

                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>⏱️ Time & Marks</h2>

                  <div style={styles.grid}>
                    <div>
                      <label style={styles.formLabel}>Time Limit *</label>
                      <select
                        style={styles.input}
                        value={newQuizTimeLimit}
                        onChange={(e) => setNewQuizTimeLimit(Number(e.target.value))}
                        required
                      >
                        <option value={1}>1 Minute (Testing)</option>
                        <option value={5}>5 Minutes</option>
                        <option value={10}>10 Minutes</option>
                        <option value={15}>15 Minutes</option>
                        <option value={20}>20 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={45}>45 Minutes</option>
                        <option value={60}>60 Minutes</option>
                        <option value={90}>90 Minutes</option>
                        <option value={120}>120 Minutes</option>
                      </select>
                    </div>

                    <div>
                      <label style={styles.formLabel}>Total Marks</label>
                      <input
                        style={styles.input}
                        type="number"
                        min="0"
                        placeholder="0 = auto calculate"
                        value={newQuizTotalMarks}
                        onChange={(e) => setNewQuizTotalMarks(Number(e.target.value))}
                      />
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "-8px" }}>
                        0 rakhein to question marks se automatically calculate hoga.
                      </div>
                    </div>

                    <div>
                      <label style={styles.formLabel}>Passing Marks</label>
                      <input
                        style={styles.input}
                        type="number"
                        min="0"
                        value={newQuizPassingMarks}
                        onChange={(e) => setNewQuizPassingMarks(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>❓ Questions</h2>

                  {newQuizQuestions.map((item, questionIndex) => (
                    <div key={questionIndex} style={{ ...styles.quizBox, marginTop: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <h2 style={{ margin: 0 }}>Question {questionIndex + 1}</h2>

                        {newQuizQuestions.length > 1 && (
                          <button
                            type="button"
                            style={{ ...styles.smallButton, background: "#dc2626" }}
                            onClick={() => removeQuestion(questionIndex)}
                          >
                            🗑 Remove
                          </button>
                        )}
                      </div>

                      <label style={styles.formLabel}>Question *</label>
                      <textarea
                        style={{ ...styles.input, minHeight: "90px", resize: "vertical" }}
                        placeholder="Question likhein..."
                        value={item.question}
                        onChange={(e) =>
                          updateQuestionField(questionIndex, "question", e.target.value)
                        }
                        required
                      />

                      <div style={styles.grid}>
                        {item.options.map((option, optionIndex) => (
                          <div key={optionIndex}>
                            <label style={styles.formLabel}>
                              Option {String.fromCharCode(65 + optionIndex)} *
                            </label>
                            <input
                              style={styles.input}
                              placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                              value={option}
                              onChange={(e) =>
                                updateQuestionOption(
                                  questionIndex,
                                  optionIndex,
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                        ))}
                      </div>

                      <div style={styles.grid}>
                        <div>
                          <label style={styles.formLabel}>Correct Answer *</label>
                          <select
                            style={styles.input}
                            value={item.correctAnswer}
                            onChange={(e) =>
                              updateQuestionField(
                                questionIndex,
                                "correctAnswer",
                                e.target.value
                              )
                            }
                            required
                          >
                            <option value="">Select Correct Answer</option>
                            {item.options.map((option, optionIndex) => (
                              <option
                                key={optionIndex}
                                value={option}
                                disabled={!option.trim()}
                              >
                                Option {String.fromCharCode(65 + optionIndex)}
                                {option.trim() ? ` — ${option}` : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={styles.formLabel}>Question Marks *</label>
                          <input
                            style={styles.input}
                            type="number"
                            min="1"
                            value={item.marks}
                            onChange={(e) =>
                              updateQuestionMarks(questionIndex, e.target.value)
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <HoverButton
                    type="button"
                    style={{
                      ...styles.secondaryButton,
                      color: "#2563eb",
                      marginTop: "18px",
                    }}
                    onClick={addQuestion}
                  >
                    + Add Another Question
                  </HoverButton>
                </div>

                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>⚙️ Quiz Settings</h2>

                  <label style={styles.formLabel}>Number of Attempts</label>
                  <select
                    style={styles.input}
                    value={newQuizNumberOfAttempts}
                    onChange={(e) => setNewQuizNumberOfAttempts(Number(e.target.value))}
                  >
                    <option value={1}>1 Attempt</option>
                    <option value={2}>2 Attempts</option>
                    <option value={3}>3 Attempts</option>
                    <option value={5}>5 Attempts</option>
                    <option value={10}>10 Attempts</option>
                  </select>

                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={newQuizRandomizeQuestions}
                      onChange={(e) => setNewQuizRandomizeQuestions(e.target.checked)}
                    />
                    <span>Randomize Questions</span>
                  </label>

                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={newQuizRandomizeOptions}
                      onChange={(e) => setNewQuizRandomizeOptions(e.target.checked)}
                    />
                    <span>Randomize Options</span>
                  </label>

                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={newQuizShowResultImmediately}
                      onChange={(e) => setNewQuizShowResultImmediately(e.target.checked)}
                    />
                    <span>Show Result Immediately</span>
                  </label>
                </div>

                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>📅 Quiz Schedule</h2>

                  <div style={styles.grid}>
                    <div>
                      <label style={styles.formLabel}>Start Date & Time</label>
                      <input
                        style={styles.input}
                        type="datetime-local"
                        value={newQuizStartDateTime}
                        onChange={(e) => setNewQuizStartDateTime(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={styles.formLabel}>End Date & Time</label>
                      <input
                        style={styles.input}
                        type="datetime-local"
                        value={newQuizEndDateTime}
                        onChange={(e) => setNewQuizEndDateTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <p style={{ color: "#64748b", fontSize: "13px", marginBottom: 0 }}>
                    Dates empty chhorne par quiz ko schedule restriction ke baghair save kiya jayega.
                  </p>
                </div>

                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>🎓 Assign to Students</h2>

                  <div style={styles.grid}>
                    <div>
                      <label style={styles.formLabel}>Department</label>
                      <input
                        style={styles.input}
                        placeholder="e.g. BS Software Engineering"
                        value={newQuizAssignedDepartment}
                        onChange={(e) => setNewQuizAssignedDepartment(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={styles.formLabel}>Class / Semester</label>
                      <input
                        style={styles.input}
                        placeholder="e.g. 5th Semester"
                        value={newQuizAssignedClassSemester}
                        onChange={(e) => setNewQuizAssignedClassSemester(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={styles.formLabel}>Student Group</label>
                      <select
                        style={styles.input}
                        value={newQuizStudentGroup}
                        onChange={(e) => setNewQuizStudentGroup(e.target.value)}
                      >
                        <option value="All Students">All Students</option>
                        <option value="Section A">Section A</option>
                        <option value="Section B">Section B</option>
                        <option value="Morning">Morning</option>
                        <option value="Evening">Evening</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>🚀 Publish Quiz</h2>

                  <label style={styles.formLabel}>Quiz Status</label>
                  <select
                    style={styles.input}
                    value={newQuizStatus}
                    onChange={(e) => setNewQuizStatus(e.target.value)}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "10px",
                      marginTop: "16px",
                    }}
                  >
                    <HoverButton
                      type="button"
                      style={styles.button}
                      onClick={(e) => handleCreateQuiz(e, "published")}
                    >
                      🚀 Publish Quiz
                    </HoverButton>

                    <HoverButton
                      type="button"
                      style={{
                        ...styles.secondaryButton,
                        marginTop: 0,
                        color: "#334155",
                      }}
                      onClick={(e) => handleCreateQuiz(e, "draft")}
                    >
                      📝 Save Draft
                    </HoverButton>

                    <HoverButton
                      type="button"
                      style={{
                        ...styles.secondaryButton,
                        marginTop: 0,
                        color: "#dc2626",
                      }}
                      onClick={() => {
                        resetQuizForm();
                        clearMessage();
                      }}
                    >
                      ↻ Reset
                    </HoverButton>
                  </div>
                </div>
              </form>

              <button
                style={styles.linkButton}
                onClick={() => {
                  clearMessage();
                  setPage("teacherDashboard");
                }}
              >
                ← Back to Teacher Dashboard
              </button>
            </>
          )}


          {page === "manageQuizzes" && (
            <>
              <h1 style={styles.title}>📋 Manage Quizzes</h1>
              <p style={styles.subtitle}>Aapke banaye huay quizzes</p>

              {message && <div style={styles.message}>{message}</div>}

              {loadingTeacherQuizzes ? (
                <div style={{ ...styles.info, textAlign: "center" }}>Quizzes load ho rahe hain...</div>
              ) : teacherQuizzes.length === 0 ? (
                <div style={{ ...styles.info, textAlign: "center" }}>
                  <h2>No Quizzes Yet</h2>
                  <p>Aapne abhi koi quiz create nahi kiya.</p>
                  <HoverButton
                    style={styles.button}
                    onClick={() => { resetQuizForm(); clearMessage(); setPage("createQuiz"); }}
                  >
                    + Create First Quiz
                  </HoverButton>
                </div>
              ) : (
                teacherQuizzes.map((quiz) => (
                  <div key={quiz._id} style={styles.quizBox}>
                    <h2 style={{ marginTop: 0 }}>{quiz.title}</h2>
                    <p style={{ color: "#64748b" }}>{quiz.description || "No description"}</p>
                    <p><strong>Questions:</strong> {quiz.questions?.length || 0}</p>
                    <p><strong>Time Limit:</strong> {quiz.timeLimit || 30} minutes</p>
                    <p style={{ color: "#64748b", fontSize: "14px" }}>
                      Created: {quiz.createdAt ? new Date(quiz.createdAt).toLocaleString() : "N/A"}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginTop: "12px",
                      }}
                    >
                      <button
                        style={{ ...styles.smallButton, background: "#2563eb" }}
                        onClick={() => startEditQuiz(quiz)}
                      >
                        ✏️ Edit Quiz
                      </button>

                      <button
                        style={{ ...styles.smallButton, background: "#dc2626" }}
                        onClick={() => handleDeleteQuiz(quiz._id)}
                      >
                        🗑 Delete Quiz
                      </button>
                    </div>
                  </div>
                ))
              )}

              <HoverButton
                style={styles.secondaryButton}
                onClick={() => { clearMessage(); setPage("teacherDashboard"); }}
              >
                ← Back to Teacher Dashboard
              </HoverButton>
            </>
          )}

          {page === "editQuiz" && (
            <>
              <h1 style={styles.title}>✏️ Edit Quiz</h1>
              <p style={styles.subtitle}>
                Quiz ki complete information, settings aur questions update karein
              </p>

              {message && <div style={styles.message}>{message}</div>}

              <form onSubmit={handleUpdateQuiz}>
                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>📝 Quiz Information</h2>

                  <label style={styles.formLabel}>Quiz Title *</label>
                  <input
                    style={styles.input}
                    value={editQuizTitle}
                    onChange={(e) => setEditQuizTitle(e.target.value)}
                    required
                  />

                  <div style={styles.grid}>
                    <div>
                      <label style={styles.formLabel}>Subject</label>
                      <input
                        style={styles.input}
                        value={editQuizSubject}
                        onChange={(e) => setEditQuizSubject(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={styles.formLabel}>Department</label>
                      <input
                        style={styles.input}
                        value={editQuizDepartment}
                        onChange={(e) => setEditQuizDepartment(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={styles.formLabel}>Class / Semester</label>
                      <input
                        style={styles.input}
                        value={editQuizClassSemester}
                        onChange={(e) => setEditQuizClassSemester(e.target.value)}
                      />
                    </div>
                  </div>

                  <label style={styles.formLabel}>Description / Instructions</label>
                  <textarea
                    style={{ ...styles.input, minHeight: "110px", resize: "vertical" }}
                    value={editQuizDescription}
                    onChange={(e) => setEditQuizDescription(e.target.value)}
                  />
                </div>

                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>⏱️ Time & Marks</h2>

                  <div style={styles.grid}>
                    <div>
                      <label style={styles.formLabel}>Time Limit *</label>
                      <select
                        style={styles.input}
                        value={editQuizTimeLimit}
                        onChange={(e) => setEditQuizTimeLimit(Number(e.target.value))}
                        required
                      >
                        <option value={1}>1 Minute (Testing)</option>
                        <option value={5}>5 Minutes</option>
                        <option value={10}>10 Minutes</option>
                        <option value={15}>15 Minutes</option>
                        <option value={20}>20 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={45}>45 Minutes</option>
                        <option value={60}>60 Minutes</option>
                        <option value={90}>90 Minutes</option>
                        <option value={120}>120 Minutes</option>
                      </select>
                    </div>

                    <div>
                      <label style={styles.formLabel}>Total Marks</label>
                      <input
                        style={styles.input}
                        type="number"
                        min="0"
                        value={editQuizTotalMarks}
                        onChange={(e) => setEditQuizTotalMarks(Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label style={styles.formLabel}>Passing Marks</label>
                      <input
                        style={styles.input}
                        type="number"
                        min="0"
                        value={editQuizPassingMarks}
                        onChange={(e) => setEditQuizPassingMarks(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>❓ Questions</h2>

                  {editQuizQuestions.map((item, questionIndex) => (
                    <div key={questionIndex} style={{ ...styles.quizBox, marginTop: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <h2 style={{ margin: 0 }}>Question {questionIndex + 1}</h2>

                        {editQuizQuestions.length > 1 && (
                          <button
                            type="button"
                            style={{ ...styles.smallButton, background: "#dc2626" }}
                            onClick={() => removeEditQuestion(questionIndex)}
                          >
                            🗑 Remove
                          </button>
                        )}
                      </div>

                      <label style={styles.formLabel}>Question *</label>
                      <textarea
                        style={{ ...styles.input, minHeight: "90px", resize: "vertical" }}
                        value={item.question}
                        onChange={(e) =>
                          updateEditQuestionField(questionIndex, "question", e.target.value)
                        }
                        required
                      />

                      <div style={styles.grid}>
                        {item.options.map((option, optionIndex) => (
                          <div key={optionIndex}>
                            <label style={styles.formLabel}>
                              Option {String.fromCharCode(65 + optionIndex)} *
                            </label>
                            <input
                              style={styles.input}
                              value={option}
                              onChange={(e) =>
                                updateEditQuestionOption(
                                  questionIndex,
                                  optionIndex,
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                        ))}
                      </div>

                      <div style={styles.grid}>
                        <div>
                          <label style={styles.formLabel}>Correct Answer *</label>
                          <select
                            style={styles.input}
                            value={item.correctAnswer}
                            onChange={(e) =>
                              updateEditQuestionField(
                                questionIndex,
                                "correctAnswer",
                                e.target.value
                              )
                            }
                            required
                          >
                            <option value="">Select Correct Answer</option>
                            {item.options.map((option, optionIndex) => (
                              <option
                                key={optionIndex}
                                value={option}
                                disabled={!option.trim()}
                              >
                                Option {String.fromCharCode(65 + optionIndex)}
                                {option.trim() ? ` — ${option}` : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={styles.formLabel}>Question Marks *</label>
                          <input
                            style={styles.input}
                            type="number"
                            min="1"
                            value={item.marks}
                            onChange={(e) =>
                              updateEditQuestionMarks(questionIndex, e.target.value)
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <HoverButton
                    type="button"
                    style={{
                      ...styles.secondaryButton,
                      color: "#2563eb",
                      marginTop: "18px",
                    }}
                    onClick={addEditQuestion}
                  >
                    + Add Another Question
                  </HoverButton>
                </div>

                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>⚙️ Quiz Settings</h2>

                  <label style={styles.formLabel}>Number of Attempts</label>
                  <select
                    style={styles.input}
                    value={editQuizNumberOfAttempts}
                    onChange={(e) => setEditQuizNumberOfAttempts(Number(e.target.value))}
                  >
                    <option value={1}>1 Attempt</option>
                    <option value={2}>2 Attempts</option>
                    <option value={3}>3 Attempts</option>
                    <option value={5}>5 Attempts</option>
                    <option value={10}>10 Attempts</option>
                  </select>

                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={editQuizRandomizeQuestions}
                      onChange={(e) => setEditQuizRandomizeQuestions(e.target.checked)}
                    />
                    <span>Randomize Questions</span>
                  </label>

                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={editQuizRandomizeOptions}
                      onChange={(e) => setEditQuizRandomizeOptions(e.target.checked)}
                    />
                    <span>Randomize Options</span>
                  </label>

                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={editQuizShowResultImmediately}
                      onChange={(e) => setEditQuizShowResultImmediately(e.target.checked)}
                    />
                    <span>Show Result Immediately</span>
                  </label>
                </div>

                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>📅 Quiz Schedule</h2>

                  <div style={styles.grid}>
                    <div>
                      <label style={styles.formLabel}>Start Date & Time</label>
                      <input
                        style={styles.input}
                        type="datetime-local"
                        value={editQuizStartDateTime}
                        onChange={(e) => setEditQuizStartDateTime(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={styles.formLabel}>End Date & Time</label>
                      <input
                        style={styles.input}
                        type="datetime-local"
                        value={editQuizEndDateTime}
                        onChange={(e) => setEditQuizEndDateTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>🎓 Assign to Students</h2>

                  <div style={styles.grid}>
                    <div>
                      <label style={styles.formLabel}>Department</label>
                      <input
                        style={styles.input}
                        value={editQuizAssignedDepartment}
                        onChange={(e) => setEditQuizAssignedDepartment(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={styles.formLabel}>Class / Semester</label>
                      <input
                        style={styles.input}
                        value={editQuizAssignedClassSemester}
                        onChange={(e) => setEditQuizAssignedClassSemester(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={styles.formLabel}>Student Group</label>
                      <select
                        style={styles.input}
                        value={editQuizStudentGroup}
                        onChange={(e) => setEditQuizStudentGroup(e.target.value)}
                      >
                        <option value="All Students">All Students</option>
                        <option value="Section A">Section A</option>
                        <option value="Section B">Section B</option>
                        <option value="Morning">Morning</option>
                        <option value="Evening">Evening</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={styles.info}>
                  <h2 style={{ marginTop: 0 }}>🚀 Publish Status</h2>

                  <label style={styles.formLabel}>Quiz Status</label>
                  <select
                    style={styles.input}
                    value={editQuizStatus}
                    onChange={(e) => setEditQuizStatus(e.target.value)}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>

                  <HoverButton
                    type="submit"
                    style={{ ...styles.button, marginTop: "10px" }}
                  >
                    💾 Update Quiz
                  </HoverButton>
                </div>
              </form>

              <button
                style={styles.linkButton}
                onClick={() => {
                  setEditingQuizId(null);
                  setEditQuizTitle("");
                  setEditQuizSubject("");
                  setEditQuizDepartment("");
                  setEditQuizClassSemester("");
                  setEditQuizDescription("");
                  setEditQuizTimeLimit(30);
                  setEditQuizTotalMarks(0);
                  setEditQuizPassingMarks(0);
                  setEditQuizNumberOfAttempts(1);
                  setEditQuizRandomizeQuestions(false);
                  setEditQuizRandomizeOptions(false);
                  setEditQuizShowResultImmediately(true);
                  setEditQuizStartDateTime("");
                  setEditQuizEndDateTime("");
                  setEditQuizAssignedDepartment("");
                  setEditQuizAssignedClassSemester("");
                  setEditQuizStudentGroup("All Students");
                  setEditQuizStatus("published");
                  setEditQuizQuestions([]);
                  clearMessage();
                  setPage("manageQuizzes");
                }}
              >
                ← Back to Manage Quizzes
              </button>
            </>
          )}


          {page === "history" && (
            <>
              <h1 style={styles.title}>📚 Quiz History</h1>
              {message && <div style={styles.message}>{message}</div>}

              {history.length === 0 ? (
                <div style={{ ...styles.info, textAlign: "center" }}>
                  <h2>No Quiz History</h2>
                  <p>Aapne abhi tak koi quiz complete nahi kiya.</p>
                </div>
              ) : (
                history.map((attempt) => {
                  const historyTotal = Number(attempt.totalMarks ?? attempt.totalQuestions) || 0;
                  const percentage =
                    historyTotal > 0
                      ? Math.round((Number(attempt.score) || 0) / historyTotal * 100)
                      : 0;

                  return (
                    <div key={attempt._id} style={styles.quizBox}>
                      <h3>{attempt.quiz?.title || "Quiz"}</h3>
                      {attempt.quiz?.description && <p>{attempt.quiz.description}</p>}
                      <p><strong>Score:</strong> {attempt.score} / {historyTotal}</p>
                      <p><strong>Percentage:</strong> {percentage}%</p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {attempt.createdAt ? new Date(attempt.createdAt).toLocaleString() : "N/A"}
                      </p>
                    </div>
                  );
                })
              )}

              <HoverButton
                style={styles.secondaryButton}
                onClick={() => { clearMessage(); setPage("dashboard"); }}
              >
                ← Back to Dashboard
              </HoverButton>
            </>
          )}

          {page === "quizList" && (() => {
            const now = new Date();

            const getAvailability = (quiz) => {
              const start = quiz.startDateTime ? new Date(quiz.startDateTime) : null;
              const end = quiz.endDateTime ? new Date(quiz.endDateTime) : null;

              if (start && !Number.isNaN(start.getTime()) && start > now) {
                return { label: "Upcoming", color: "#dc2626", bg: "#fef2f2", available: false };
              }

              if (end && !Number.isNaN(end.getTime()) && end < now) {
                return { label: "Expired", color: "#64748b", bg: "#f1f5f9", available: false };
              }

              if (start && !Number.isNaN(start.getTime())) {
                return { label: "Ongoing", color: "#b45309", bg: "#fffbeb", available: true };
              }

              return { label: "Available", color: "#15803d", bg: "#f0fdf4", available: true };
            };

            const formatQuizDate = (value) => {
              if (!value) return "Not set";
              const date = new Date(value);
              if (Number.isNaN(date.getTime())) return "Not set";
              return date.toLocaleString([], {
                month: "short",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
            };

            const subjects = [
              "All Subjects",
              ...Array.from(
                new Set(
                  quizzes
                    .map((quiz) => quiz.subject?.trim())
                    .filter(Boolean)
                )
              ),
            ];

            const completedQuizIds = new Set(
              history
                .map((attempt) => attempt.quiz?._id || attempt.quiz)
                .filter(Boolean)
                .map((id) => id.toString())
            );

            const completedCount = completedQuizIds.size;
            const pendingCount = Math.max(0, quizzes.length - completedCount);
            const averageScore = history.length
              ? Math.round(
                  history.reduce((sum, attempt) => {
                    const total = Number(attempt.totalMarks ?? attempt.quiz?.totalMarks ?? attempt.totalQuestions) || 0;
                    const score = Number(attempt.score) || 0;
                    return sum + (total > 0 ? (score / total) * 100 : 0);
                  }, 0) / history.length
                )
              : 0;

            const filteredQuizzes = quizzes.filter((quiz) => {
              const search = quizSearch.trim().toLowerCase();
              const questionText = Array.isArray(quiz.questions)
                ? quiz.questions.map((q) => `${q.question || ""} ${(q.options || []).join(" ")}`).join(" ")
                : "";

              const matchesSearch = !search ||
                `${quiz.title || ""} ${quiz.description || ""} ${quiz.subject || ""} ${quiz.department || ""} ${quiz.classSemester || ""} ${questionText}`
                  .toLowerCase()
                  .includes(search);

              const matchesSubject =
                quizSubjectFilter === "All Subjects" ||
                (quiz.subject || "").trim() === quizSubjectFilter;

              return matchesSearch && matchesSubject;
            });

            const statCard = (icon, label, value, iconBg) => (
              <div
                style={{
                  flex: "1 1 190px",
                  minWidth: "180px",
                  background: "var(--theme-panel)",
                  border: "1px solid var(--theme-border)",
                  borderRadius: "16px",
                  padding: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  boxShadow: "0 8px 22px rgba(0,0,0,.2)",
                }}
              >
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "13px",
                    background: iconBg,
                    display: "grid",
                    placeItems: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: "13px", color: "var(--theme-muted)", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "25px", fontWeight: 800, color: "var(--theme-text)" }}>{value}</div>
                </div>
              </div>
            );

            return (
              <div
                className="student-portal-frame"
                style={{
                  margin: 0,
                  minHeight: "720px",
                  background: "var(--theme-bg)",
                  display: "flex",
                  overflow: "hidden",
                  borderRadius: "12px",
                }}
              >
                <aside
                  className="student-portal-sidebar"
                  style={{
                    width: "190px",
                    background: "linear-gradient(180deg, #0a1024 0%, #101a38 100%)",
                    color: "white",
                    padding: "22px 12px",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 10px 22px", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
                    <div style={{ fontSize: "28px" }}>🎓</div>
                    <div>
                      <div style={{ fontSize: "20px", fontWeight: 800 }}>QuizHub</div>
                      <div style={{ fontSize: "10px", opacity: .7 }}>Learn • Take Quiz • Grow</div>
                    </div>
                  </div>

                  <div className="student-portal-nav" style={{ marginTop: "20px", display: "grid", gap: "7px" }}>
                    {[
                      ["🏠", "Dashboard", "dashboard"],
                      ["▦", "Available Quizzes", "quizList"],
                      ["📄", "My Quizzes", "history"],
                      ["📊", "Results", "history"],
                      ["👤", "Profile", "editProfile"],
                    ].map(([icon, label, target]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          clearMessage();
                          if (target === "history") {
                            loadQuizHistory();
                          } else if (target === "editProfile") {
                            setPage("editProfile");
                          } else {
                            setPage(target);
                          }
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          border: "none",
                          borderRadius: "10px",
                          padding: "12px 10px",
                          cursor: "pointer",
                          color: "white",
                          background: target === "quizList" ? "linear-gradient(100deg, #5143ec, #6657f2)" : "transparent",
                          fontWeight: target === "quizList" ? 800 : 600,
                          fontSize: "13px",
                        }}
                      >
                        <span style={{ marginRight: "10px" }}>{icon}</span>{label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      marginTop: "auto",
                      position: "relative",
                      top: "315px",
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      background: "transparent",
                      color: "white",
                      padding: "12px 10px",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ marginRight: "10px" }}>↪</span> Logout
                  </button>
                </aside>

                <main className="student-portal-main" style={{ flex: 1, minWidth: 0, padding: "18px 22px 28px", overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", paddingBottom: "14px", borderBottom: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#64748b", fontSize: "13px" }}>Student Portal</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ fontSize: "21px" }}>🔔</div>
                      <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#eef2f7", display: "grid", placeItems: "center", fontWeight: 800, color: "#1e3a8a" }}>
                        {profilePicture ? <img src={profilePicture} alt="Profile" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : shownName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ lineHeight: 1.1 }}>
                        <div style={{ fontWeight: 800, fontSize: "13px" }}>{shownName}</div>
                        <div style={{ color: "#64748b", fontSize: "11px" }}>Student</div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "18px",
                      borderRadius: "14px",
                      padding: "20px",
                      background: "linear-gradient(110deg, #322a8d, #204d92 62%, #152a51)",
                      border: "1px solid rgba(137, 126, 255, 0.32)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "20px",
                    }}
                  >
                    <div>
                      <h1 style={{ margin: 0, color: "var(--theme-text)", fontSize: "25px" }}>Welcome back, {user?.name || "Student"}!</h1>
                      <p style={{ margin: "7px 0 0", color: "var(--theme-muted)", fontSize: "13px" }}>Explore available quizzes, improve your skills and track your progress.</p>
                    </div>
                    <div style={{ fontSize: "45px" }}>📚</div>
                  </div>

                  <div style={{ display: "flex", gap: "13px", flexWrap: "wrap", marginTop: "16px" }}>
                    {statCard("▤", "Total Available Quizzes", quizzes.length, "rgba(91, 76, 246, 0.2)")}
                    {statCard("✓", "Completed Quizzes", completedCount, "rgba(34, 211, 238, 0.16)")}
                    {statCard("◷", "Pending Quizzes", pendingCount, "rgba(251, 146, 60, 0.16)")}
                    {statCard("★", "Average Score", `${averageScore}%`, "rgba(167, 139, 250, 0.18)")}
                  </div>

                  {message && <div style={{ ...styles.message, marginTop: "16px" }}>{message}</div>}

                  <div style={{ marginTop: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: "19px", color: "var(--theme-text)" }}>Available Quizzes</h2>
                        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "12px" }}>Here are all the quizzes assigned to you. Click on Take Quiz to start.</p>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <input
                            value={quizSearch}
                            onChange={(e) => setQuizSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                            placeholder="🔍 Search quizzes..."
                            aria-label="Search quizzes"
                            style={{ ...styles.input, width: "210px", margin: 0, padding: "10px 12px" }}
                          />
                          {quizSearch && (
                            <button type="button" onClick={() => setQuizSearch("")} style={{ border: "1px solid #dbeafe", background: "#eff6ff", color: "#24508a", borderRadius: "9px", padding: "9px 10px", cursor: "pointer", fontWeight: 700 }}>✕</button>
                          )}
                        </div>
                        <select
                          value={quizSubjectFilter}
                          onChange={(e) => setQuizSubjectFilter(e.target.value)}
                          style={{ ...styles.input, width: "145px", margin: 0, padding: "10px 12px" }}
                        >
                          {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </div>
                    </div>

                    {filteredQuizzes.length === 0 ? (
                      <div style={{ ...styles.info, textAlign: "center" }}>
                        <div style={{ fontSize: "35px" }}>📭</div>
                        <h3 style={{ margin: "8px 0" }}>No quizzes found</h3>
                        <p style={{ margin: 0, color: "#64748b" }}>Search/filter change karke dobara try karein.</p>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: "12px" }}>
                        {filteredQuizzes.map((quiz) => {
                          const availability = getAvailability(quiz);
                          const completed = completedQuizIds.has(quiz._id?.toString());
                          const statusLabel = completed ? "Completed" : availability.label;
                          const statusColor = completed ? "#15803d" : availability.color;
                          const statusBg = completed ? "#f0fdf4" : availability.bg;

                          return (
                            <div
                              className="student-quiz-row"
                              key={quiz._id}
                              style={{
                                background: "var(--theme-panel)",
                                border: "1px solid var(--theme-border)",
                                borderRadius: "14px",
                                padding: "15px",
                                display: "grid",
                                gridTemplateColumns: "52px minmax(180px,1.6fr) minmax(180px,1fr) minmax(145px,.8fr)",
                                gap: "14px",
                                alignItems: "center",
                                boxShadow: "0 4px 15px rgba(15,23,42,.04)",
                              }}
                            >
                              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(91, 76, 246, 0.2)", color: "#c9c2ff", display: "grid", placeItems: "center", fontSize: "25px" }}>
                                {quiz.subject?.toLowerCase().includes("javascript") ? "JS" : quiz.subject?.toLowerCase().includes("python") ? "🐍" : quiz.subject?.toLowerCase().includes("database") ? "🗄️" : quiz.subject?.toLowerCase().includes("web") ? "</>" : "📝"}
                              </div>

                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                                  <h3 style={{ margin: 0, color: "var(--theme-text)", fontSize: "16px" }}>{quiz.title}</h3>
                                  <span style={{ padding: "4px 8px", borderRadius: "20px", background: statusBg, color: statusColor, fontSize: "10px", fontWeight: 800 }}>{statusLabel}</span>
                                </div>
                                <p style={{ margin: "6px 0 8px", color: "#64748b", fontSize: "11px", lineHeight: 1.45 }}>{quiz.description || "Test your knowledge and improve your skills."}</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", color: "#64748b", fontSize: "10px" }}>
                                  <span>📚 {quiz.subject || "General"}</span>
                                  <span>🏛️ {quiz.department || "All Departments"}</span>
                                  <span>👥 {quiz.classSemester || "All Classes"}</span>
                                </div>
                              </div>

                              <div style={{ display: "grid", gap: "8px", color: "#475569", fontSize: "11px" }}>
                                <div>⏱️ <strong>Time Limit:</strong> {quiz.timeLimit || 30} minutes</div>
                                <div>▣ <strong>Total Marks:</strong> {quiz.totalMarks || (quiz.questions?.length || 0)}</div>
                                <div>✓ <strong>Passing Marks:</strong> {quiz.passingMarks || 0}</div>
                              </div>

                              <div style={{ display: "grid", gap: "7px" }}>
                                <div style={{ fontSize: "10px", color: "#64748b" }}>📅 Start: {formatQuizDate(quiz.startDateTime)}</div>
                                <div style={{ fontSize: "10px", color: "#64748b" }}>⌛ End: {formatQuizDate(quiz.endDateTime)}</div>
                                <HoverButton
                                  style={{
                                    ...styles.smallButton,
                                    width: "100%",
                                    opacity: availability.available ? 1 : .55,
                                    cursor: availability.available ? "pointer" : "not-allowed",
                                  }}
                                  disabled={!availability.available}
                                  onClick={() => availability.available && handleOpenQuiz(quiz)}
                                >
                                  {availability.available ? "▶ Take Quiz" : "◷ Not Available Yet"}
                                </HoverButton>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                    </main>
              </div>
            );
          })()}

          {page === "quiz" && selectedQuiz && question && (
            <>
              <h1 style={styles.title}>{selectedQuiz.title}</h1>
              {message && <div style={styles.message}>{message}</div>}

              <div style={styles.info}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <strong>
                    Question {currentQuestion + 1} of {selectedQuiz.questions.length}
                  </strong>
                  <strong
                    style={{
                      color: timeLeft <= 60 ? "#dc2626" : "#2563eb",
                      fontSize: "20px",
                    }}
                  >
                    ⏱️ {formatTime(timeLeft)}
                  </strong>
                </div>
              </div>

              <h2 style={{ lineHeight: 1.4 }}>
                {question.question || question.text}
              </h2>

              <div style={{ marginTop: "22px" }}>
                {question.options?.map((option, index) => {
                  const isSelected = answers[currentQuestion] === option;

                  return (
                    <div
                      key={index}
                      style={isSelected ? styles.selectedOption : styles.option}
                      onClick={() => handleAnswerSelect(option)}
                    >
                      <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                    </div>
                  );
                })}
              </div>

              <div style={styles.navigation}>
                <button
                  style={{
                    ...styles.secondaryButton,
                    marginTop: 0,
                    opacity: currentQuestion === 0 ? 0.5 : 1,
                  }}
                  disabled={currentQuestion === 0}
                  onClick={handlePreviousQuestion}
                >
                  ← Previous
                </button>

                {currentQuestion < selectedQuiz.questions.length - 1 ? (
                  <HoverButton style={{ ...styles.button, marginTop: 0 }} onClick={handleNextQuestion}>
                    Next →
                  </HoverButton>
                ) : (
                  <HoverButton
                    style={{ ...styles.button, marginTop: 0, background: "linear-gradient(135deg, #16a34a, #059669)" }}
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz}
                  >
                    {submittingQuiz ? "Submitting..." : "Submit Quiz ✓"}
                  </HoverButton>
                )}
              </div>

              <button
                style={styles.linkButton}
                onClick={() => {
                  setSelectedQuiz(null);
                  setQuizSessionToken("");
                  setAnswers([]);
                  setCurrentQuestion(0);
                  setTimeLeft(0);
                  setPage("quizList");
                  clearMessage();
                }}
              >
                Exit Quiz
              </button>

            </>
          )}

          {page === "quizResult" && quizResult && (
            <>
              <div style={{ textAlign: "center", fontSize: "52px" }}>🎉</div>
              <h1 style={styles.title}>Quiz Completed!</h1>
              <p style={styles.subtitle}>Your result is ready</p>

              <div style={{ ...styles.info, textAlign: "center", padding: "30px" }}>
                <p style={{ color: "#64748b", marginBottom: "5px" }}>Your Score</p>
                <div style={{ fontSize: "48px", fontWeight: 800, color: "#2563eb" }}>
                  {quizResult.score} / {quizResult.totalMarks ?? quizResult.totalQuestions}
                </div>
                <p>Quiz successfully submit ho gaya hai.</p>
                <p>
                  Percentage: {quizResult.percentage ?? 0}% • {quizResult.passed ? "Passed ✓" : "Failed"}
                </p>
              </div>

              <HoverButton
                style={styles.button}
                onClick={() => {
                  setSelectedQuiz(null);
                  setQuizSessionToken("");
                  setAnswers([]);
                  setCurrentQuestion(0);
                  setTimeLeft(0);
                  setQuizResult(null);
                  setPage("quizList");
                }}
              >
                Back to Quizzes
              </HoverButton>

              <HoverButton
                style={styles.secondaryButton}
                onClick={() => {
                  setSelectedQuiz(null);
                  setQuizSessionToken("");
                  setAnswers([]);
                  setCurrentQuestion(0);
                  setTimeLeft(0);
                  setQuizResult(null);
                  setPage("dashboard");
                }}
              >
                Dashboard
              </HoverButton>

            </>
          )}

          {page === "editProfile" && (
            <>
              <h1 style={styles.title}>👤 Edit Profile</h1>
              {message && <div style={styles.message}>{message}</div>}

              <form onSubmit={handleUpdateProfile}>
                <div style={{ display: "grid", placeItems: "center", marginBottom: "18px" }}>
                  <div style={{ width: "110px", height: "110px", borderRadius: "50%", overflow: "hidden", background: "#eaf2ff", border: "4px solid #dbeafe", display: "grid", placeItems: "center", fontSize: "40px", color: "#24508a", fontWeight: 800 }}>
                    {profilePicture ? <img src={profilePicture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : shownName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginTop: "10px" }}>
                    <label style={{ ...styles.secondaryButton, width: "auto", padding: "9px 16px", cursor: "pointer", margin: 0 }}>
                      📷 {profilePicture ? "Change Picture" : "Add Picture"}
                      <input type="file" accept="image/*" onChange={handleProfilePictureChange} style={{ display: "none" }} />
                    </label>
                    {profilePicture && (
                      <button type="button" onClick={() => setProfilePicture("")} style={{ ...styles.secondaryButton, width: "auto", padding: "9px 16px", cursor: "pointer" }}>
                        Remove Picture
                      </button>
                    )}
                  </div>
                </div>
                <input style={styles.input} placeholder="Full Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                <input style={styles.input} type="email" placeholder="Email" value={user?.email || ""} readOnly />
                {isTeacher ? (
                  <input
                    style={styles.input}
                    placeholder="Teacher ID"
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                  />
                ) : (
                  <>
                    <input style={styles.input} placeholder="Class" value={className} onChange={(e) => setClassName(e.target.value)} required />
                    <input style={styles.input} placeholder="Section" value={section} onChange={(e) => setSection(e.target.value)} required />
                    <input style={styles.input} placeholder="Roll Number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required />
                    <input style={styles.input} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                  </>
                )}
                <HoverButton style={styles.button} type="submit">Update Profile ✓</HoverButton>
              </form>

              <button style={styles.linkButton} onClick={() => { setPage(isTeacher ? "teacherDashboard" : "dashboard"); clearMessage(); }}>
                ← Back to Dashboard
              </button>
            </>
          )}

          {page === "forgot" && (
            <>
              <h1 style={styles.title}>🔐 Forgot Password</h1>
              <p style={styles.subtitle}>Email enter karein; password reset link aapko email kar di jayegi.</p>
              {message && <div style={styles.message}>{message}</div>}

              <form onSubmit={handleForgotPassword}>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <HoverButton style={styles.button} type="submit">Request Reset</HoverButton>
              </form>

              <div style={{ textAlign: "center" }}>
                <button style={styles.linkButton} onClick={() => { setPage("login"); clearMessage(); }}>
                  ← Back to Login
                </button>
              </div>
            </>
          )}

          {page === "reset" && (
            <>
              <h1 style={styles.title}>🔑 Reset Password</h1>
              {message && <div style={styles.message}>{message}</div>}

              {!resetToken && (
                <input
                  style={styles.input}
                  placeholder="Reset Token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
              )}

              <form onSubmit={handleResetPassword}>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <HoverButton style={styles.button} type="submit">Reset Password</HoverButton>
              </form>

              <div style={{ textAlign: "center" }}>
                <button style={styles.linkButton} onClick={() => { setPage("login"); clearMessage(); }}>
                  ← Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
