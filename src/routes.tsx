import React from 'react'
const Institution = React.lazy(() => import('./views/setup/Institution'))
const Department = React.lazy(() => import('./views/setup/Department'))
const Programmes = React.lazy(() => import('./views/setup/Programmes'))
const AcademicYearConfiguration = React.lazy(() => import('./views/setup/AcademicYearConfiguration'))
const ClassesConfiguration = React.lazy(() => import('./views/setup/ClassesConfiguration'))
const RegulationConfiguration = React.lazy(() => import('./views/setup/RegulationConfiguration'))
const CoursesConfiguration = React.lazy(() => import('./views/setup/CoursesConfiguration'))
const RegulationMapConfiguration = React.lazy(() => import('./views/setup/RegulationMapConfiguration'))
const CommonScheduleConfiguration = React.lazy(() => import('./views/setup/CommonScheduleConfiguration'))
const StudentConfiguration= React.lazy(() => import('./views/setup/StudentConfiguration'))
const FacultyConfiguration= React.lazy(() => import('./views/setup/FacultyConfiguration'))
const CalendarConfiguration= React.lazy(() => import('./views/setup/CalendarConfiguration'))
const TimetableConfiguration = React.lazy(() => import('./views/setup/TimetableConfiguration'))
const QuestionModelConfiguration = React.lazy(() => import('./views/setup/QuestionModelConfiguration'))
const CIAComponentsConfiguration = React.lazy(() => import('./views/setup/CIAComponentsConfiguration'))
const CIAComputationConfiguration = React.lazy(() => import('./views/setup/CIAComputationConfiguration'))
const AssessmentSetupConfiguration= React.lazy(() => import('./views/setup/AssessmentSetupConfiguration'))
const UploadPhotoConfiguration= React.lazy(() => import('./views/setup/UploadPhotoConfiguration'))

// Learning Management System (LMS) components can be added here similarly
const CourseAllotment = React.lazy(() => import('./views/lms/CourseAllotment'))
const StudentAllotment = React.lazy(() => import('./views/lms/StudentAllotment'))
const UploadTimetable = React.lazy(() => import('./views/lms/UploadTimetable'))
const ViewTimetable = React.lazy(() => import('./views/lms/ViewTimetable'))
const ViewCalendar = React.lazy(() => import('./views/lms/ViewCalendar'))
const CourseContents = React.lazy(() => import('./views/lms/CourseContents'))
const CourseMaterials = React.lazy(() => import('./views/lms/CourseMaterials'))
const CommonSchedule = React.lazy(() => import('./views/lms/CommonSchedule'))
const LectureSchedule = React.lazy(() => import('./views/lms/LectureSchedule'))
const Attendance = React.lazy(() => import('./views/lms/Attendance'))
const LearningActivities = React.lazy(() => import('./views/lms/LearningActivities'))
const LearnerActivities = React.lazy(() => import('./views/lms/learner-activities'))
const Assignments = React.lazy(() => import('./views/lms/Assignments'))
const InternalAssessment = React.lazy(() => import('./views/lms/InternalAssessment'))
const SyllabusCompletion = React.lazy(() => import('./views/lms/SyllabusCompletion'))
const OnlineClasses = React.lazy(() => import('./views/lms/OnlineClasses'))


// ===== Phase 3+ : Migrated ARP modules =====
const AddManual = React.lazy(() => import('./views/accreditation/AddManual'))
const AddDataLabel = React.lazy(() => import('./views/accreditation/AddDataLabel'))
const ExtendedProfile = React.lazy(() => import('./views/accreditation/ExtendedProfile'))
const AddEpMetrics = React.lazy(() => import('./views/accreditation/AddEpMetrics'))
const CriteriaSetup = React.lazy(() => import('./views/accreditation/CriteriaSetup'))
const KeyIndicatorSetup = React.lazy(() => import('./views/accreditation/KeyIndicatorSetup'))
const MetricSetup = React.lazy(() => import('./views/accreditation/MetricSetup'))
const SubMetricSetup = React.lazy(() => import('./views/accreditation/SubMetricSetup'))
const QualitativeSetup = React.lazy(() => import('./views/accreditation/QualitativeSetup'))
const QuantitativeSetup = React.lazy(() => import('./views/accreditation/QuantitativeSetup'))
const GradeSetup = React.lazy(() => import('./views/accreditation/GradeSetup'))
const DocumentsSetup = React.lazy(() => import('./views/accreditation/DocumentsSetup'))
const ExpertPanelSetup = React.lazy(() => import('./views/accreditation/ExpertPanelSetup'))

// Academics components
const TutorWard = React.lazy(() => import('./views/academics/TutorWard'))
const WardEnrollment = React.lazy(() => import('./views/academics/WardEnrollment'))
const WardProfile = React.lazy(() => import('./views/academics/WardProfile'))
const WardMeetings = React.lazy(() => import('./views/academics/WardMeetings'))
const AcademicEvents = React.lazy(() => import('./views/academics/AcademicEvents'))
const StudentProfile = React.lazy(() => import('./views/academics/StudentProfile'))
const FacultyProfile = React.lazy(() => import('./views/academics/FacultyProfile'))

// OBE components
const ObeConfiguration = React.lazy(() => import('./views/obe/ObeConfiguration'))
const CourseOutcomes = React.lazy(() => import('./views/obe/CourseOutcomes'))
const ObeMarkEntry = React.lazy(() => import('./views/obe/ObeMarkEntry'))
const ObeAttainment = React.lazy(() => import('./views/obe/ObeAttainment'))
const AttainmentReport = React.lazy(() => import('./views/obe/AttainmentReport'))
const ArticulationMatrix = React.lazy(() => import('./views/obe/ArticulationMatrix'))

// Examination & Evaluation components
const QuestionBank = React.lazy(() => import('./views/evaluation/QuestionBank'))
const QuestionPaper = React.lazy(() => import('./views/evaluation/QuestionPaper'))
const ScheduleExamination = React.lazy(() => import('./views/evaluation/ScheduleExamination'))
const OnlineExamination = React.lazy(() => import('./views/evaluation/OnlineExamination'))
const MarkEntry = React.lazy(() => import('./views/evaluation/MarkEntry'))
const ResultAnalysis = React.lazy(() => import('./views/evaluation/ResultAnalysis'))

// RESEARCH ACTIVITIES, INNOVATION, EXTENSION, OUTREACH, COLLABORATION, MOUS
const ResearchActivities = React.lazy(() => import('./views/research/ResearchActivities'))
const ResearchInnovation = React.lazy(() => import('./views/research/ResearchInnovation'))
const ResearchExtension = React.lazy(() => import('./views/research/ResearchExtension'))
const ResearchOutreach = React.lazy(() => import('./views/research/ResearchOutreach'))
const ResearchCollaboration = React.lazy(() => import('./views/research/ResearchCollaboration'))
const ResearchMoU = React.lazy(() => import('./views/research/ResearchMoU'))

// STUDENT SUPPORT SYSTEM COMPONENTS CAN BE ADDED HERE  
const SkillEnhancement = React.lazy(() => import('./views/studsupport/SkillEnhancement'))
const CompetitiveExaminations = React.lazy(() => import('./views/studsupport/CompetitiveExaminations'))



// STUDENT PROFILE COMPONENTS CAN BE ADDED HERE
const StudentProfileBasic = React.lazy(() => import('./views/studprofile/StudentProfileBasic'))
const StudentAcademicProfile = React.lazy(() => import('./views/studprofile/StudentAcademicProfile'))
const StudentExtraCurricular = React.lazy(() => import('./views/studprofile/StudentExtraCurricular'))
const StudentPlacements = React.lazy(() => import('./views/studprofile/StudentPlacements'))
const StudentProgression = React.lazy(() => import('./views/studprofile/StudentProgression'))

// STUDENT GRIEVANCE COMPONENTS CAN BE ADDED HERE
const ViewAffidavits = React.lazy(() => import('./views/grievances/ViewAffidavits'))
const ViewComplaints = React.lazy(() => import('./views/grievances/ViewComplaints'))

// PLACEMENTS COMPONENTS CAN BE ADDED HERE
const CompanyDetails = React.lazy(() => import('./views/placements/CompanyDetails'))
const PlacementMOUs = React.lazy(() => import('./views/placements/PlacementMOUs'))
const PlacementSchedule = React.lazy(() => import('./views/placements/PlacementSchedule'))
const PlacementActivities = React.lazy(() => import('./views/placements/PlacementActivities'))
const PlacementDrives = React.lazy(() => import('./views/placements/PlacementDrives'))
const PlacementOffers = React.lazy(() => import('./views/placements/PlacementOffers'))
const PlacementReports = React.lazy(() => import('./views/placements/PlacementReports'))

// ACCREDITATION MANAGEMENT SYSTEM (AMS) COMPONENTS CAN BE ADDED HERE
const AMSExtendedProfile = React.lazy(() => import('./views/ams/AMSExtendedProfile'))
const AMSExecutiveSummary = React.lazy(() => import('./views/ams/AMSExecutiveSummary'))
const AMSQIFMetrics = React.lazy(() => import('./views/ams/AMSQIFMetrics'))
const ExpertView = React.lazy(() => import('./views/ams/ExpertView'))

// FEEDACK SYSTEM COMPONENTS CAN BE ADDED HERE
const FeedbackConfiguration = React.lazy(() => import('./views/feedback/FeedbackConfiguration'))
const CourseFeedback = React.lazy(() => import('./views/feedback/CourseFeedback'))
const AssignFeedback = React.lazy(() => import('./views/feedback/AssignFeedback'))
const AnalysisReportAssignedFeedback = React.lazy(() => import('./views/feedback/AnalysisReportAssignedFeedback'))
const AnalysisReportCourseFeedback = React.lazy(() => import('./views/feedback/AnalysisReportCourseFeedback'))
const SSRIntrospection = React.lazy(() => import('./views/ams/SSRIntrospection'))
const SSRCGPAScore = React.lazy(() => import('./views/ams/SSRCGPAScore'))
const SubmitSSR = React.lazy(() => import('./views/ams/SubmitSSR'))

// REPORTS COMPONENTS CAN BE ADDED HERE
const PrimaryReports = React.lazy(() => import('./views/reports/PrimaryReports'))
const AcademicReports = React.lazy(() => import('./views/reports/AcademicReports'))
const CompliancesReports = React.lazy(() => import('./views/reports/CompliancesReports'))
const AccreditationReports = React.lazy(() => import('./views/reports/AccreditationReports'))
const MiscellaneousReports = React.lazy(() => import('./views/reports/MiscellaneousReports'))




const Page = (name) => () => <div className="p-4">{name}</div>

const routes = [
  { path: '/', exact: true, name: 'Home' },

  // Home items
  { path: '/home', name: 'Home', element: Page('Home') },
  { path: '/dashboard', name: 'Dashboard', element: Page('Dashboard') },

  // Setup dropdown items
  { path: '/setup/institution', name: 'Institution', element: Institution },
  { path: '/setup/department', name: 'Department', element: Department },
  { path: '/setup/programmes', name: 'Programmes', element: Programmes },
  { path: '/setup/academic-year', name: 'Academic Year', element: AcademicYearConfiguration },
  { path: '/setup/classes', name: 'Classes', element: ClassesConfiguration },
  { path: '/setup/regulation', name: 'Regulation', element: RegulationConfiguration },
  { path: '/setup/courses', name: 'Courses Configuration', element: CoursesConfiguration },
  { path: '/setup/regulation-map', name: 'Regulation Map', element: RegulationMapConfiguration },
  { path: '/setup/combined-courses', name: 'Combined Courses', element: CommonScheduleConfiguration},
  { path: '/setup/student', name: 'Student', element: StudentConfiguration },
  { path: '/setup/faculty', name: 'Faculty', element: FacultyConfiguration },
  { path: '/setup/calendar', name: 'Calendar', element: CalendarConfiguration },
  { path: '/setup/timetable', name: 'Timetable', element: TimetableConfiguration },
  { path: '/setup/question-models', name: 'Question Models', element: QuestionModelConfiguration },
  { path: '/setup/cia-components', name: 'CIA Components', element: CIAComponentsConfiguration },
  { path: '/setup/cia-computations', name: 'CIA Computations', element: CIAComputationConfiguration},
  { path: '/setup/assessment-setup', name: 'Assessment Setup', element: AssessmentSetupConfiguration},
  { path: '/setup/upload-photo', name: 'Upload Photo', element: UploadPhotoConfiguration },

  // ===== Phase 2 : Accreditation =====
  { path: '/accreditation/add-manual', name: 'Add Manual', element: AddManual },
  { path: '/accreditation/add-data-labels', name: 'Add Data Labels', element: AddDataLabel},
  { path: '/accreditation/extended-profile', name: 'Extended Profile', element: ExtendedProfile},
  { path: '/accreditation/add-ep-metrics', name: 'Add EP Metrics', element: AddEpMetrics },
  { path: '/accreditation/criteria', name: 'Criteria', element: CriteriaSetup},
  { path: '/accreditation/key-indicators', name: 'Key Indicators', element: KeyIndicatorSetup},
  { path: '/accreditation/main-metrics', name: 'Main Metrics', element: MetricSetup },
  { path: '/accreditation/sub-metrics', name: 'Sub Metrics', element: SubMetricSetup },
  { path: '/accreditation/qualitative', name: 'Qualitative', element: QualitativeSetup },
  { path: '/accreditation/quantitative', name: 'Quantitative', element: QuantitativeSetup },
  { path: '/accreditation/grade', name: 'Grade', element: GradeSetup },
  { path: '/accreditation/documents', name: 'Documents', element: DocumentsSetup },
  { path: '/accreditation/expert-panel', name: 'Expert Panel', element: ExpertPanelSetup },

  // ===== Phase 3 : Learning Management System =====
  { path: '/lms/course-allotment', name: 'Course Allotment', element: CourseAllotment },
  { path: '/lms/student-allotment', name: 'Student Allotment', element: StudentAllotment },
  { path: '/lms/upload-timetable', name: 'Upload Timetable', element: UploadTimetable },
  { path: '/lms/view-timetable', name: 'View Timetable', element: ViewTimetable },
  { path: '/lms/view-calendar', name: 'View Calendar', element: ViewCalendar },
  { path: '/lms/course-contents', name: 'Course Contents', element: CourseContents },
  { path: '/lms/course-materials', name: 'Course Materials', element: CourseMaterials },
  { path: '/lms/common-schedule', name: 'Common Schedule', element: CommonSchedule },
  { path: '/lms/lecture-schedule', name: 'Lecture Schedule', element: LectureSchedule },
  { path: '/lms/attendance', name: 'Attendance', element: Attendance },
  { path: '/lms/assignments', name: 'Assignments', element: Assignments },

  { path: '/lms/syllabus-completion', name: 'Syllabus Completion', element: SyllabusCompletion},
  { path: '/lms/online-classes', name: 'Online Classes', element: OnlineClasses},
  { path: '/lms/activities', name: 'Activities', element: LearningActivities },
  { path: '/lms/learner-activities', name: 'Learner Activities', element: LearnerActivities },
  { path: '/lms/internal-assessment', name: 'Internal Assessment', element: InternalAssessment},

  // ===== Phase 4 : Academic Events =====
  { path: '/academics/tutor-ward', name: 'Tutor Ward', element: TutorWard },
  { path: '/academics/ward-enrollment', name: 'Ward Enrollment', element: WardEnrollment },
  { path: '/academics/ward-profile', name: 'Ward Profile', element: WardProfile },
  { path: '/academics/ward-meetings', name: 'Ward Meetings', element: WardMeetings },
  { path: '/academics/academic-events', name: 'Academic Events', element: AcademicEvents },
  { path: '/academics/student-profile', name: 'Student Profile', element: StudentProfile },
  { path: '/academics/faculty-profile', name: 'Faculty Profile', element: FacultyProfile },

  // ===== Phase 5 : Outcome Based Education =====
  { path: '/obe/dashboard', name: 'OBE Dashboard', element: Page('OBE Dashboard') },
  { path: '/obe/configuration', name: 'OBE Configuration', element: ObeConfiguration },
  { path: '/obe/course-outcomes', name: 'Course Outcomes', element: CourseOutcomes },
  { path: '/obe/mark-entry', name: 'Mark Entry', element: ObeMarkEntry },
  { path: '/obe/obe-attainment', name: 'OBE Attainment', element: ObeAttainment },
  { path: '/obe/attainment-reports', name: 'Attainment Reports', element: AttainmentReport },
  { path: '/obe/articulation-matrix', name: 'Articulation Matrix', element: ArticulationMatrix },

  // ===== Phase 6 : Internal Assessment =====
  { path: '/evaluation/question-bank', name: 'Question Bank', element: QuestionBank },
  { path: '/evaluation/question-paper', name: 'Question Paper', element: QuestionPaper },
  { path: '/evaluation/schedule-examination', name: 'Schedule Examination', element: ScheduleExamination},
  { path: '/evaluation/online-examination', name: 'Online Examination', element: OnlineExamination},
  { path: '/evaluation/mark-entry', name: 'Mark Entry', element: MarkEntry },
  { path: '/evaluation/result-analysis', name: 'Result Analysis', element: ResultAnalysis},

  // ===== Phase 7 : Research & Innovation =====
  { path: '/research/activities', name: 'Research Activities', element: ResearchActivities },
  { path: '/research/innovation', name: 'Innovation', element: ResearchInnovation },
  { path: '/research/extension', name: 'Extension', element: ResearchExtension },
  { path: '/research/outreach', name: 'Outreach', element: ResearchOutreach },
  { path: '/research/collaboration', name: 'Collaboration', element: ResearchCollaboration },
  { path: '/research/mous', name: 'MoUs', element: ResearchMoU },

  // ===== Phase 8 : Student Support System =====
  { path: '/student-support/skill-enhancement', name: 'Skill Enhancement', element: SkillEnhancement},
  { path: '/student-support/competitive-exams', name: 'Competitive Exams', element: CompetitiveExaminations},

  // ===== Phase 9 : Student Information System =====
  { path: '/student-profile/basic-profile', name: 'Basic Profile', element: StudentProfileBasic },
  { path: '/student-profile/academic-profile', name: 'Academic Profile', element: StudentAcademicProfile},
  { path: '/student-profile/extra-curricular', name: 'Extra-Curricular', element: StudentExtraCurricular},
  { path: '/student-profile/placements', name: 'Placements', element: StudentPlacements },
  { path: '/student-profile/progression', name: 'Progression', element: StudentProgression },

  // ===== Phase 10 : Grievance System =====
  { path: '/grievances/view-affidavit', name: 'View Affidavit', element: ViewAffidavits },
  { path: '/grievances/view-complaints', name: 'View Complaints', element: ViewComplaints },
 

  // ===== Phase 11 : Placement Information =====
  { path: '/placements/company-details', name: 'Company Details', element: CompanyDetails},
  { path: '/placements/mous', name: 'Placement MoUs', element: PlacementMOUs},
  { path: '/placements/schedule', name: 'Placement Schedule', element: PlacementSchedule },
  { path: '/placements/activities', name: 'Placement Activities', element: PlacementActivities},
  { path: '/placements/drives', name: 'Placement Drives', element: PlacementDrives},
  { path: '/placements/offers', name: 'Placement Offers', element: PlacementOffers},
  { path: '/placements/reports', name: 'Placement Reports', element: PlacementReports},

  // ===== Phase 12 : Accreditation System (AMS) =====
  { path: '/ams/dashboard', name: 'AMS Dashboard', element: Page('AMS Dashboard') },
  { path: '/ams/profile-ssr', name: 'Profile of SSR', element: Page('Profile of SSR') },
  { path: '/ams/extended-profile', name: 'AMS Extended Profile', element: AMSExtendedProfile },
  { path: '/ams/executive-summary', name: 'Executive Summary', element: AMSExecutiveSummary },
  { path: '/ams/qif-metrics', name: 'QIF Metrics', element: AMSQIFMetrics },
  { path: '/ams/expert-views', name: 'Expert Views', element: ExpertView },
  { path: '/ams/ssr-introspect', name: 'SSR Introspect', element: SSRIntrospection },
  { path: '/ams/cgpa-score', name: 'CGPA Score', element: SSRCGPAScore },
  { path: '/ams/submit-ssr', name: 'Submit SSR', element: SubmitSSR },

  // ===== Phase 13 : Admin (Governance) =====
  { path: '/governance/circular', name: 'Circular', element: Page('Circular') },
  { path: '/governance/communication', name: 'Communication', element: Page('Communication') },
  { path: '/governance/leave-management', name: 'Leave Management', element: Page('Leave Management')},
  { path: '/governance/activities', name: 'Governance Activities', element: Page('Governance Activities')},
  { path: '/governance/drives', name: 'Governance Drives', element: Page('Governance Drives')},
  { path: '/governance/offers', name: 'Governance Offers', element: Page('Governance Offers')},
  { path: '/governance/reports', name: 'Governance Reports', element: Page('Governance Reports')},

  // ===== Phase 14 : Feedback System =====
  { path: '/feedback/configuration', name: 'Feedback Configuration', element: FeedbackConfiguration},
  { path: '/feedback/feedback', name: 'Feedback', element: Page('Feedback')},
  { path: '/feedback/course-feedback', name: 'Course Feedback', element: CourseFeedback},
  { path: '/feedback/assign-feedback', name: 'Assign Feedback', element: AssignFeedback},
  { path: '/feedback/analysis-report', name: 'Analysis Report', element: AnalysisReportAssignedFeedback},
  { path: '/feedback/AR-course-feedback', name: 'AR Course Feedback', element: AnalysisReportCourseFeedback},

  // ===== Phase 15 : Report System =====
  { path: '/reports/primary', name: 'Primary Reports', element: PrimaryReports},
  { path: '/reports/academics', name: 'Academics Reports', element: AcademicReports},
  { path: '/reports/compliances', name: 'Compliances Reports', element: CompliancesReports},
  { path: '/reports/accreditation', name: 'Accreditation Reports', element: AccreditationReports},
  { path: '/reports/miscellaneous', name: 'Miscellaneous Reports', element: MiscellaneousReports},

  // ===== Phase 16 : Gallery =====
  { path: '/gallery', name: 'Gallery', element: Page('Gallery') },

  // ===== Phase 17 : FAQ =====
  { path: '/faq', name: 'FAQ', element: Page('FAQ') },

  // ===== Phase 18 : ARP Management =====
  { path: '/arp/support-helpdesk', name: 'Support & Helpdesk', element: Page('Support & Helpdesk')},
  { path: '/arp/invoices', name: 'Invoices', element: Page('Invoices')},
  { path: '/arp/payments', name: 'Payments', element: Page('Payments')},

  // ===== Phase 19 : Authorization =====
  { path: '/auth/admin', name: 'Authorization - Admin', element: Page('Authorization - Admin') },
  { path: '/auth/groups', name: 'Authorization - Groups', element: Page('Authorization - Groups') },
]

export default routes