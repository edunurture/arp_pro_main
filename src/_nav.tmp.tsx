import React from 'react'
import CIcon from '@coreui/icons-react'
import { CNavItem, CNavGroup, CNavTitle } from '@coreui/react-pro'
import {
  cilHome,
  cilSettings,
  cilLayers,
  cilEducation,
  cilSchool,
  cilChartPie,
  cilSpreadsheet,
  cilLightbulb,
  cilPeople,
  cilUser,
  cilWarning,
  cilBriefcase,
  cilBuilding,
  cilBalanceScale,
  cilChatBubble,
  cilChartLine,
  cilImage,
  cilInfo,
  cilCreditCard,
  cilDollar,
  cilLockLocked,
} from '@coreui/icons'






const icon = (i) => <CIcon icon={i} customClassName="nav-icon" />

const _nav = [
  {
    component: CNavItem,
    name: 'Home',
    to: '/dashboard',
    icon: icon(cilHome),
  },

  {
    component: CNavTitle,
    name: 'Configuration',
  },
  // SETUP CONFIGURATION NAV GROUP MENU ITEMS
  {
    component: CNavGroup,
    name: 'Setup',
    to: '/setup',
    icon: icon(cilSettings),
    items: [
      { component: CNavItem, name: 'Institution', to: '/setup/institution' },
      { component: CNavItem, name: 'Department', to: '/setup/department' },
      { component: CNavItem, name: 'Programmes', to: '/setup/programmes' },
      { component: CNavItem, name: 'Academic Year', to: '/setup/academic-year' },
      { component: CNavItem, name: 'Classes', to: '/setup/classes' },
      { component: CNavItem, name: 'Regulation', to: '/setup/regulation' },
      { component: CNavItem, name: 'Courses', to: '/setup/courses' },
      { component: CNavItem, name: 'Regulation Map', to: '/setup/regulation-map' },
      { component: CNavItem, name: 'Combined Courses', to: '/setup/combined-courses' },
      { component: CNavItem, name: 'Student', to: '/setup/student' },
      { component: CNavItem, name: 'Faculty', to: '/setup/faculty' },
      { component: CNavItem, name: 'Calendar', to: '/setup/calendar' },
      { component: CNavItem, name: 'Timetable', to: '/setup/timetable' },
      { component: CNavItem, name: 'Question Models', to: '/setup/question-models' },
      { component: CNavItem, name: 'CIA Components', to: '/setup/cia-components' },
      { component: CNavItem, name: 'CIA Computations', to: '/setup/cia-computations' },
      { component: CNavItem, name: 'Assessment Setup', to: '/setup/assessment-setup' },
      { component: CNavItem, name: 'Upload Photo', to: '/setup/upload-photo' },
    ],
  },

  //   // ===== Phase 2 : Accreditation Config =====
  /*{
    component: CNavTitle,
    name: 'Accreditation Config',
  },*/

  {
    component: CNavGroup,
    name: 'Accreditation',
    to: '/accreditation',
    icon: icon(cilLayers),
    items: [
      { component: CNavItem, name: 'Add Manual', to: '/accreditation/add-manual' },
      { component: CNavItem, name: 'Add Data Labels', to: '/accreditation/add-data-labels' },
      { component: CNavItem, name: 'Extended Profile', to: '/accreditation/extended-profile' },
      { component: CNavItem, name: 'Add EP Metrics', to: '/accreditation/add-ep-metrics' },
      { component: CNavItem, name: 'Criteria', to: '/accreditation/criteria' },
      { component: CNavItem, name: 'Key Indicators', to: '/accreditation/key-indicators' },
      { component: CNavItem, name: 'Main Metrics', to: '/accreditation/main-metrics' },
      { component: CNavItem, name: 'Sub Metrics', to: '/accreditation/sub-metrics' },
      { component: CNavItem, name: 'Qualitative', to: '/accreditation/qualitative' },
      { component: CNavItem, name: 'Quantitative', to: '/accreditation/quantitative' },
      { component: CNavItem, name: 'Grade', to: '/accreditation/grade' },
      { component: CNavItem, name: 'Documents', to: '/accreditation/documents' },
      { component: CNavItem, name: 'Expert Panel', to: '/accreditation/expert-panel' },
    ],
  },

  // ===== Phase 3 : Learning Management System =====
  {
    component: CNavTitle,
    name: 'Learning Management',
  },

  {
    component: CNavGroup,
    name: 'LMS',
    to: '/lms',
    icon: icon(cilEducation),
    items: [
      { component: CNavItem, name: 'Course Allotment', to: '/lms/course-allotment' },
      { component: CNavItem, name: 'Student Allotment', to: '/lms/student-allotment' },
      { component: CNavItem, name: 'Upload Timetable', to: '/lms/upload-timetable' },
      { component: CNavItem, name: 'View Timetable', to: '/lms/view-timetable' },
      { component: CNavItem, name: 'View Calendar', to: '/lms/view-calendar' },
      { component: CNavItem, name: 'Course Contents', to: '/lms/course-contents' },
      { component: CNavItem, name: 'Course Materials', to: '/lms/course-materials' },
      { component: CNavItem, name: 'Common Schedule', to: '/lms/common-schedule' },
      { component: CNavItem, name: 'Lecture Schedule', to: '/lms/lecture-schedule' },
      { component: CNavItem, name: 'Attendance', to: '/lms/attendance' },
      { component: CNavItem, name: 'Syllabus Completion', to: '/lms/syllabus-completion' },
      { component: CNavItem, name: 'Online Classes', to: '/lms/online-classes' },
      { component: CNavItem, name: 'Activities', to: '/lms/activities' },
      { component: CNavItem, name: 'Learner Activities', to: '/lms/learner-activities' },
      { component: CNavItem, name: 'Assignments', to: '/lms/assignments' },
      { component: CNavItem, name: 'Internal Assessment', to: '/lms/internal-assessment' },
    ],
  },

  // ===== Phase 4 : Academic Events =====
  

  {
    component: CNavGroup,
    name: 'Academics',
    to: '/academics',
    icon: icon(cilSchool),
    items: [
      { component: CNavItem, name: 'Tutor Ward', to: '/academics/tutor-ward' },
      { component: CNavItem, name: 'Ward Enrollment', to: '/academics/ward-enrollment' },
      { component: CNavItem, name: 'Ward Profile', to: '/academics/ward-profile' },
      { component: CNavItem, name: 'Ward Meetings', to: '/academics/ward-meetings' },
      { component: CNavItem, name: 'Academic Events', to: '/academics/academic-events' },
      { component: CNavItem, name: 'Student Profile', to: '/academics/student-profile' },
      { component: CNavItem, name: 'Faculty Profile', to: '/academics/faculty-profile' },
    ],
  },

  // ===== Phase 5 : Outcome Based Education =====
  

  {
    component: CNavGroup,
    name: 'OBE',
    to: '/obe',
    icon: icon(cilChartPie),
    items: [
      { component: CNavItem, name: 'Dashboard', to: '/obe/dashboard' },
      { component: CNavItem, name: 'Configuration', to: '/obe/configuration' },
      { component: CNavItem, name: 'Course Outcomes', to: '/obe/course-outcomes' },
      { component: CNavItem, name: 'Mark Entry', to: '/obe/mark-entry' },
      { component: CNavItem, name: 'OBE Attainment', to: '/obe/obe-attainment' },
      { component: CNavItem, name: 'Attainment Reports', to: '/obe/attainment-reports' },
      { component: CNavItem, name: 'Articulation Matrix', to: '/obe/articulation-matrix' },
    ],
  },

  // ===== Phase 6 : Internal Assessment =====
 
  {
    component: CNavGroup,
    name: 'Evaluation',
    to: '/evaluation',
    icon: icon(cilSpreadsheet),
    items: [
      { component: CNavItem, name: 'Question Bank', to: '/evaluation/question-bank' },
      { component: CNavItem, name: 'Question Paper', to: '/evaluation/question-paper' },
      { component: CNavItem, name: 'Schedule Examination', to: '/evaluation/schedule-examination' },
      { component: CNavItem, name: 'Online Examination', to: '/evaluation/online-examination' },
      { component: CNavItem, name: 'Mark Entry', to: '/evaluation/mark-entry' },
      { component: CNavItem, name: 'Result Analysis', to: '/evaluation/result-analysis' },
    ],
  },

  // ===== Phase 7 : Research & Innovation =====
  

  {
    component: CNavGroup,
    name: 'Research',
    to: '/research',
    icon: icon(cilLightbulb),
    items: [
      { component: CNavItem, name: 'Activities', to: '/research/activities' },
      { component: CNavItem, name: 'Innovation', to: '/research/innovation' },
      { component: CNavItem, name: 'Extension', to: '/research/extension' },
      { component: CNavItem, name: 'Outreach', to: '/research/outreach' },
      { component: CNavItem, name: 'Collaboration', to: '/research/collaboration' },
      { component: CNavItem, name: 'MoUs', to: '/research/mous' },
    ],
  },

  // ===== Phase 8 : Student Support System =====
  {
    component: CNavTitle,
    name: 'Student Support System',
  },

  {
    component: CNavGroup,
    name: 'Student Support',
    to: '/student-support',
    icon: icon(cilPeople),
    items: [
      { component: CNavItem, name: 'Skill Enhancement', to: '/student-support/skill-enhancement' },
      { component: CNavItem, name: 'Competitive Exams', to: '/student-support/competitive-exams' },
    ],
  },

  // ===== Phase 9 : Student Information System =====
  

  {
    component: CNavGroup,
    name: 'Student Profile',
    to: '/student-profile',
    icon: icon(cilUser),
    items: [
      { component: CNavItem, name: 'Basic Profile', to: '/student-profile/basic-profile' },
      { component: CNavItem, name: 'Academic Profile', to: '/student-profile/academic-profile' },
      { component: CNavItem, name: 'Extra-Curricular', to: '/student-profile/extra-curricular' },
      { component: CNavItem, name: 'Placements', to: '/student-profile/placements' },
      { component: CNavItem, name: 'Progression', to: '/student-profile/progression' },
    ],
  },

  // ===== Phase 10 : Grievance System =====
  
  {
    component: CNavGroup,
    name: 'Grievances',
    to: '/grievances',
    icon: icon(cilWarning),
    items: [
      { component: CNavItem, name: 'View Affidavit', to: '/grievances/view-affidavit' },
      { component: CNavItem, name: 'View Complaints', to: '/grievances/view-complaints' },
      { component: CNavItem, name: 'Examination Grievances', to: '/grievances/exam' },
      { component: CNavItem, name: 'General Grievances', to: '/grievances/general' },
    ],
  },

  // ===== Phase 11 : Placement Information =====
  
  {
    component: CNavGroup,
    name: 'Placements',
    to: '/placements',
    icon: icon(cilBriefcase),
    items: [
      { component: CNavItem, name: 'Company Details', to: '/placements/company-details' },
      { component: CNavItem, name: 'MoUs', to: '/placements/mous' },
      { component: CNavItem, name: 'Schedule', to: '/placements/schedule' },
      { component: CNavItem, name: 'Activities', to: '/placements/activities' },
      { component: CNavItem, name: 'Drives', to: '/placements/drives' },
      { component: CNavItem, name: 'Offers', to: '/placements/offers' },
      { component: CNavItem, name: 'Reports', to: '/placements/reports' },
    ],
  },

  // ===== Phase 12 : Accreditation System =====
  { component: CNavTitle, name: 'Accreditation System' },
  {
    component: CNavGroup,
    name: 'AMS',
    to: '/ams',
    icon: icon(cilBuilding),
    items: [
      { component: CNavItem, name: 'Dashboard', to: '/ams/dashboard' },
      { component: CNavItem, name: 'MoUs', to: '/ams/mous' },
      { component: CNavItem, name: 'Profile of SSR', to: '/ams/profile-ssr' },
      { component: CNavItem, name: 'Extended Profile', to: '/ams/extended-profile' },
      { component: CNavItem, name: 'Executive Summary', to: '/ams/executive-summary' },
      { component: CNavItem, name: 'QIF Metrics', to: '/ams/qif-metrics' },
      { component: CNavItem, name: 'Expert Views', to: '/ams/expert-views' },
      { component: CNavItem, name: 'SSR Introspect', to: '/ams/ssr-introspect' },
      { component: CNavItem, name: 'CGPA Score', to: '/ams/cgpa-score' },
      { component: CNavItem, name: 'Submit SSR', to: '/ams/submit-ssr' },
    ],
  },

  // ===== Phase 13 : Admin =====
  { component: CNavTitle, name: 'Admin' },
  {
    component: CNavGroup,
    name: 'Governance',
    to: '/governance',
    icon: icon(cilBalanceScale),
    items: [
      { component: CNavItem, name: 'Circular', to: '/governance/circular' },
      { component: CNavItem, name: 'Communication', to: '/governance/communication' },
      { component: CNavItem, name: 'Leave Management', to: '/governance/leave-management' },
      { component: CNavItem, name: 'Activities', to: '/governance/activities' },
      { component: CNavItem, name: 'Drives', to: '/governance/drives' },
      { component: CNavItem, name: 'Offers', to: '/governance/offers' },
      { component: CNavItem, name: 'Reports', to: '/governance/reports' },
    ],
  },

  // ===== Phase 14 : Feedback System =====
  
  {
    component: CNavGroup,
    name: 'Feedback',
    to: '/feedback',
    icon: icon(cilChatBubble),
    items: [
      { component: CNavItem, name: 'Configuration', to: '/feedback/configuration' },
      { component: CNavItem, name: 'Feedback', to: '/feedback/feedback' },
      { component: CNavItem, name: 'Course Feedback', to: '/feedback/course-feedback' },
      { component: CNavItem, name: 'Assign Feedback', to: '/feedback/assign-feedback' },
      { component: CNavItem, name: 'Analysis Report', to: '/feedback/analysis-report' },
    ],
  },

  // ===== Phase 15 : Report System =====
  
  {
    component: CNavGroup,
    name: 'Reports',
    to: '/reports',
    icon: icon(cilChartLine),
    items: [
      { component: CNavItem, name: 'Primary', to: '/reports/primary' },
      { component: CNavItem, name: 'Academics', to: '/reports/academics' },
      { component: CNavItem, name: 'Compliances', to: '/reports/compliances' },
      { component: CNavItem, name: 'Accreditation', to: '/reports/accreditation' },
      { component: CNavItem, name: 'Miscellaneous', to: '/reports/miscellaneous' },
    ],
  },

  // ===== Phase 16 : Gallery System =====
  
  {
    component: CNavItem,
    name: 'Gallery',
    to: '/gallery',
    icon: icon(cilImage),
  },

  // ===== Phase 17 : Frequently Asked Question =====
  
  {
    component: CNavItem,
    name: 'FAQ',
    to: '/faq',
    icon: icon(cilInfo),
  },

  // ===== Phase 18 : ARP Management =====
  { component: CNavTitle, name: 'ARP Management' },
  {
    component: CNavItem,
    name: 'Support & Helpdesk',
    to: '/arp/support-helpdesk',
    icon: icon(cilCreditCard),
  },
  {
    component: CNavItem,
    name: 'Invoices',
    to: '/arp/invoices',
    icon: icon(cilDollar),
  },
  {
    component: CNavItem,
    name: 'Payments',
    to: '/arp/payments',
    icon: icon(cilDollar),
  },

  // ===== Phase 19 : Authorization =====
  
  {
    component: CNavGroup,
    name: 'Authorization',
    to: '/auth',
    icon: icon(cilLockLocked),
    items: [
      { component: CNavItem, name: 'Admin', to: '/auth/admin' },
      { component: CNavItem, name: 'Groups', to: '/auth/groups' },
    ],
  },
]


export default _nav
